from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def run_tests():
    print("=== Running Backend API Tests ===")

    # 1. Health check
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health check ok")

    # 2. Admin Login
    res = client.post("/api/auth/login", data={"username": "admin@institute.edu", "password": "Admin@123"})
    assert res.status_code == 200, f"Admin login failed: {res.text}"
    admin_token = res.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] Admin login ok")

    # 3. Dept User Login
    res = client.post("/api/auth/login", data={"username": "cse@institute.edu", "password": "Dept@123"})
    assert res.status_code == 200, f"Dept user login failed: {res.text}"
    dept_token = res.json()["access_token"]
    dept_headers = {"Authorization": f"Bearer {dept_token}"}
    print("[PASS] Dept user login ok")

    # 4. Dashboard Stats
    res = client.get("/api/dashboard/stats", headers=admin_headers)
    assert res.status_code == 200, f"Dashboard stats failed: {res.text}"
    stats = res.json()
    assert stats["kpis"]["total_departments"] >= 6
    assert stats["kpis"]["total_faculty"] > 0
    print(f"[PASS] Dashboard stats computed: {stats['kpis']['total_departments']} depts, {stats['kpis']['total_faculty']} faculty, {stats['kpis']['total_publications']} pubs")

    # 5. Department Report Isolation
    res = client.get("/api/reports/my-report", headers=dept_headers)
    assert res.status_code == 200, f"My report failed: {res.text}"
    my_rep = res.json()
    assert my_rep["department_code"] == "CSE"
    print(f"[PASS] CSE report access verified (Report ID: {my_rep['id']})")

    # Access Denied Test: Try accessing MECH report (id 4) with CSE token
    # Let's find a report id that is not CSE
    all_reps = client.get("/api/reports/", headers=admin_headers).json()
    other_rep = next((r for r in all_reps if r["department_code"] != "CSE"), None)
    if other_rep:
        res = client.get(f"/api/reports/{other_rep['id']}", headers=dept_headers)
        assert res.status_code == 403, f"Expected 403 Forbidden for cross-dept access, got {res.status_code}"
        print(f"[PASS] Cross-department isolation enforced (HTTP 403 for {other_rep['department_code']})")

    # 6. Aggregate Annual Report (only approved reports included)
    ay_open_id = stats["academic_year_id"]
    res = client.get(f"/api/reports/aggregate/{ay_open_id}", headers=admin_headers)
    assert res.status_code == 200, f"Aggregate report failed: {res.text}"
    agg = res.json()
    assert agg["approved_departments_count"] >= 1 # At least 1 approved dept included
    print(f"[PASS] Aggregation engine verified: {agg['approved_departments_count']} approved depts included")

    # 7. PDF Generation with ReportLab
    res = client.get(f"/api/reports/generate-pdf/{ay_open_id}", headers=admin_headers)
    assert res.status_code == 200, f"PDF generation failed: {res.text}"
    assert res.headers["content-type"] == "application/pdf"
    assert len(res.content) > 1000, "PDF content seems empty"
    print(f"[PASS] ReportLab PDF generated successfully ({len(res.content)} bytes)")

    # 8. Public Portal Access
    res = client.get("/api/public/academic-years")
    assert res.status_code == 200, f"Public AYs failed: {res.text}"
    pub_years = res.json()
    assert all(y["status"] == "PUBLISHED" for y in pub_years), "Unpublished academic year found in public endpoint!"
    print(f"[PASS] Public portal academic years: {[y['name'] for y in pub_years]} (Only PUBLISHED)")

    if pub_years:
        pub_ay_id = pub_years[0]["id"]
        res = client.get(f"/api/public/reports/{pub_ay_id}")
        assert res.status_code == 200, f"Public report view failed: {res.text}"
        pub_rep = res.json()
        assert pub_rep["status"] == "PUBLISHED"
        print(f"[PASS] Public annual report interactive view verified for {pub_years[0]['name']}")

        res = client.get(f"/api/public/reports/{pub_ay_id}/pdf")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/pdf"
        print(f"[PASS] Public official PDF download verified ({len(res.content)} bytes)")

    # 9. Notifications
    res = client.get("/api/notifications/", headers=admin_headers)
    assert res.status_code == 200
    print(f"[PASS] Notifications endpoint verified ({len(res.json())} notifications)")

    # 10. Audit Logs
    res = client.get("/api/audit-logs/", headers=admin_headers)
    assert res.status_code == 200
    print(f"[PASS] Audit logs endpoint verified ({len(res.json())} logs)")

    print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
