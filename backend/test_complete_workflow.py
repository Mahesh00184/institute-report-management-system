import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_workflow():
    print("=======================================================")
    print("INSTITUTE: FULL END-TO-END WORKFLOW & AUTHORIZATION TEST")
    print("=======================================================\n")

    # Step 1: Admin Login
    print("Step 1: Admin login...")
    admin_login_res = client.post("/api/auth/login", data={"username": "admin@institute.edu", "password": "Admin@123"})
    assert admin_login_res.status_code == 200, f"Admin login failed: {admin_login_res.text}"
    admin_token = admin_login_res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("  [OK] Admin logged in successfully.\n")

    # Step 2: Create Academic Year
    print("Step 2: Create Academic Year 2026-2027...")
    ay_data = {
        "name": "2026-2027",
        "start_date": "2026-07-01",
        "end_date": "2027-06-30",
        "submission_deadline": "2027-05-31",
        "description": "Workflow verification test session",
        "status": "OPEN"
    }
    ay_res = client.post("/api/academic-years/", json=ay_data, headers=admin_headers)
    if ay_res.status_code == 400 and "already exists" in ay_res.text:
        # Fetch existing
        all_ays = client.get("/api/academic-years/").json()
        test_ay = next(y for y in all_ays if y["name"] == "2026-2027")
    else:
        assert ay_res.status_code == 200, f"Failed creating AY: {ay_res.text}"
        test_ay = ay_res.json()
    test_ay_id = test_ay["id"]
    print(f"  [OK] Academic Year active: {test_ay['name']} (ID: {test_ay_id})\n")

    # Step 3: Create Department
    print("Step 3: Create test department: Aerospace Engineering (AERO)...")
    dept_data = {
        "name": "Aerospace Engineering",
        "short_code": "AERO",
        "head_of_department": "Dr. A. P. J. Verma",
        "email": "aero.hod@institute.edu",
        "phone": "+91-9988776655",
        "description": "Department of Aeronautics and Space Propulsion",
        "status": "ACTIVE"
    }
    dept_res = client.post("/api/departments/", json=dept_data, headers=admin_headers)
    if dept_res.status_code == 400 and "already exists" in dept_res.text:
        all_depts = client.get("/api/departments/").json()
        test_dept = next(d for d in all_depts if d["short_code"] == "AERO")
    else:
        assert dept_res.status_code == 200, f"Failed creating Department: {dept_res.text}"
        test_dept = dept_res.json()
    test_dept_id = test_dept["id"]
    print(f"  [OK] Department active: {test_dept['name']} (ID: {test_dept_id})\n")

    # Step 4: Create Department User
    print("Step 4: Create Department User for AERO...")
    user_data = {
        "email": "aero@institute.edu",
        "full_name": "AERO Coordinator",
        "password": "DeptPassword@123",
        "role": "DEPARTMENT",
        "department_id": test_dept_id,
        "is_active": True
    }
    user_res = client.post("/api/users/", json=user_data, headers=admin_headers)
    if user_res.status_code == 400 and "already exists" in user_res.text:
        pass # Already created
    else:
        assert user_res.status_code == 200, f"Failed creating user: {user_res.text}"
    print("  [OK] Department user created: aero@institute.edu\n")

    # Step 5: Department User Login
    print("Step 5: Department User Login...")
    dept_login_res = client.post("/api/auth/login", data={"username": "aero@institute.edu", "password": "DeptPassword@123"})
    assert dept_login_res.status_code == 200, f"Dept login failed: {dept_login_res.text}"
    dept_token = dept_login_res.json()["access_token"]
    dept_headers = {"Authorization": f"Bearer {dept_token}"}
    print("  [OK] Department user logged in successfully.\n")

    # Step 6: Department User Initializes and Fills Report
    print("Step 6: Department fills report draft...")
    my_rep_res = client.get(f"/api/reports/my-report?academic_year_id={test_ay_id}", headers=dept_headers)
    assert my_rep_res.status_code == 200, f"Failed getting my report: {my_rep_res.text}"
    my_report = my_rep_res.json()
    report_id = my_report["id"]
    assert my_report["department_id"] == test_dept_id

    # If the report is in a non-draft status from a previous test run, reset it to DRAFT for idempotency
    from app.db.session import SessionLocal
    from app.models.report import DepartmentReport
    _db = SessionLocal()
    _rep = _db.query(DepartmentReport).filter(DepartmentReport.id == report_id).first()
    if _rep and _rep.status != "DRAFT":
        _rep.status = "DRAFT"
        _db.commit()
    _db.close()

    print(f"  [OK] Report draft initialized (ID: {report_id})")

    draft_payload = {
        "department_info": {
            "name": "Aerospace Engineering",
            "overview": "Pioneering research in hypersonic propulsion and satellite constellations.",
            "vision": "Global leadership in aerospace engineering education.",
            "mission": "Foster rigorous aeronautical research and ethical engineers."
        },
        "faculty": [
            {"name": "Dr. A. P. J. Verma", "designation": "Professor & HOD", "qualification": "Ph.D. Caltech", "specialization": "Aerodynamics", "experience_years": 18.0},
            {"name": "Dr. Sunita Rao", "designation": "Associate Professor", "qualification": "Ph.D. IIT Bombay", "specialization": "Rocket Propulsion", "experience_years": 10.0}
        ],
        "student_statistics": {
            "total_students": 240,
            "male_students": 160,
            "female_students": 80,
            "ug_students": 200,
            "pg_students": 40,
            "graduating_students": 55
        },
        "research": [
            {"title": "Supersonic Combustion Ramjet Performance at Mach 6", "authors": "Verma, A. P. J.", "publication_type": "Journal", "journal_or_conference_name": "AIAA Journal", "year": 2026, "doi_link": "https://doi.org/10.2514/1.J060000"}
        ],
        "projects": [
            {"title": "CubeSat Nano-Satellite Orbit Demonstration", "project_type": "Innovation", "student_names": "Team AeroSat", "faculty_guide": "Dr. Sunita Rao", "funding_amount": 400000.0, "description": "1U CubeSat payload for atmospheric telemetry."}
        ],
        "events": [
            {"event_name": "National Aeromodelling & Drone Symposium", "event_type": "Workshop", "participants_count": 220, "venue": "Flight Arena"}
        ],
        "achievements": [
            {"title": "Best Student Nano-Satellite Design Award", "person_or_team": "Team AeroSat", "category": "Student", "level": "National", "description": "Awarded by ISRO."}
        ],
        "placement": {
            "eligible_students": 50,
            "placed_students": 46,
            "highest_package": 32.5,
            "average_package": 13.8,
            "lowest_package": 6.5,
            "companies_visited": 20
        },
        "collaborations": [
            {"company_name": "ISRO / DRDO", "mou_signed": True, "collaborative_activities": "Payload testing and student apprenticeships."}
        ],
        "infrastructures": [
            {"facility_name": "Supersonic Wind Tunnel Facility", "lab_type": "Aerodynamics Lab", "major_equipment": "Mach 3.5 Blowdown Wind Tunnel", "cost": 6500000.0, "area_sqft": 1600.0}
        ]
    }
    save_draft_res = client.put(f"/api/reports/{report_id}/draft", json=draft_payload, headers=dept_headers)
    assert save_draft_res.status_code == 200, f"Save draft failed: {save_draft_res.text}"
    print("  [OK] Report draft saved with 10 sections populated.\n")

    # Step 7: Submit Report
    print("Step 7: Submit report for review...")
    submit_res = client.post(f"/api/reports/{report_id}/submit", headers=dept_headers)
    assert submit_res.status_code == 200, f"Submission failed: {submit_res.text}"
    assert submit_res.json()["status"] == "SUBMITTED"
    print("  [OK] Report successfully SUBMITTED.\n")

    # Step 8: Admin Review & Request Correction
    print("Step 8: Admin reviews report and requests correction...")
    review_req = {
        "status": "CORRECTION_REQUIRED",
        "admin_feedback": "Please attach student registration numbers for the CubeSat project."
    }
    review_res = client.post(f"/api/reports/{report_id}/review", json=review_req, headers=admin_headers)
    assert review_res.status_code == 200, f"Review failed: {review_res.text}"
    assert review_res.json()["status"] == "CORRECTION_REQUIRED"
    print("  [OK] Status changed to CORRECTION_REQUIRED with admin feedback.\n")

    # Step 9: Department Resubmission
    print("Step 9: Department updates data and resubmits...")
    # Update project description to address feedback
    draft_payload["projects"][0]["description"] = "1U CubeSat payload with verified student registrations."
    client.put(f"/api/reports/{report_id}/draft", json=draft_payload, headers=dept_headers)
    resubmit_res = client.post(f"/api/reports/{report_id}/submit", headers=dept_headers)
    assert resubmit_res.status_code == 200
    assert resubmit_res.json()["status"] == "SUBMITTED"
    print("  [OK] Department successfully RESUBMITTED the report.\n")

    # Step 10: Admin Approval
    print("Step 10: Admin approves report...")
    approve_req = {
        "status": "APPROVED",
        "admin_feedback": "All requirements verified. Report approved for annual compilation."
    }
    approve_res = client.post(f"/api/reports/{report_id}/review", json=approve_req, headers=admin_headers)
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"
    print("  [OK] Report APPROVED!\n")

    # Step 11: Annual Report Aggregation (Only APPROVED reports included)
    print("Step 11: Testing Annual Report Aggregation...")
    agg_res = client.get(f"/api/reports/aggregate/{test_ay_id}", headers=admin_headers)
    assert agg_res.status_code == 200
    agg_data = agg_res.json()
    assert agg_data["approved_departments_count"] >= 1
    assert agg_data["institute_totals"]["total_faculty"] >= 2
    assert agg_data["institute_totals"]["total_students"] >= 240
    print(f"  [OK] Aggregation verified: {agg_data['approved_departments_count']} approved depts, {agg_data['institute_totals']['total_faculty']} faculty, {agg_data['institute_totals']['total_students']} students.\n")

    # Step 12: PDF Generation with ReportLab
    print("Step 12: Testing PDF Generation with ReportLab...")
    pdf_res = client.get(f"/api/reports/generate-pdf/{test_ay_id}", headers=admin_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert "Institute_Annual_Report" in pdf_res.headers["content-disposition"]
    assert len(pdf_res.content) > 2000
    print(f"  [OK] ReportLab PDF compiled: {len(pdf_res.content)} bytes\n")

    # Step 13: Academic Year Publication & Public Portal Access
    print("Step 13: Admin publishes Academic Year to Public Portal...")
    pub_ay_res = client.put(f"/api/academic-years/{test_ay_id}", json={"status": "PUBLISHED"}, headers=admin_headers)
    assert pub_ay_res.status_code == 200
    assert pub_ay_res.json()["status"] == "PUBLISHED"

    # Public user (no auth headers!) accesses report
    pub_res = client.get(f"/api/public/reports/{test_ay_id}")
    assert pub_res.status_code == 200
    assert pub_res.json()["status"] == "PUBLISHED"
    print("  [OK] Public user successfully accessed published annual report.")

    pub_pdf_res = client.get(f"/api/public/reports/{test_ay_id}/pdf")
    assert pub_pdf_res.status_code == 200
    assert pub_pdf_res.headers["content-type"] == "application/pdf"
    print("  [OK] Public user successfully downloaded published annual report PDF.\n")

    # Step 14: AUTHORIZATION TESTS
    print("Step 14: Security & Authorization Boundary Checks...")
    # A. Department user cannot access admin APIs
    unauth_res = client.get("/api/users/", headers=dept_headers)
    assert unauth_res.status_code == 403, f"Expected 403 for dept user accessing admin users API, got {unauth_res.status_code}"
    print("  [OK] Department user blocked from accessing admin-only APIs (HTTP 403).")

    # B. Department A cannot access Department B's report
    # Try accessing CSE report (ID 1) with AERO coordinator token
    cross_res = client.get("/api/reports/1", headers=dept_headers)
    assert cross_res.status_code == 403, f"Expected 403 for cross-department report access, got {cross_res.status_code}"
    print("  [OK] Cross-department isolation enforced (HTTP 403).")

    # C. Public user cannot access unpublished academic years
    # 2025-2026 is currently status "OPEN" (not published)
    all_ays = client.get("/api/academic-years/").json()
    open_ay = next(y for y in all_ays if y["status"] == "OPEN")
    unpub_res = client.get(f"/api/public/reports/{open_ay['id']}")
    assert unpub_res.status_code == 404, f"Expected 404 for public access to unpublished year, got {unpub_res.status_code}"
    print("  [OK] Public users strictly prevented from accessing unpublished reports (HTTP 404).")

    print("\n=======================================================")
    print("ALL 14 WORKFLOW & AUTHORIZATION STEPS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    test_full_workflow()
