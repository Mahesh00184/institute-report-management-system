from datetime import date, datetime, timedelta
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.department import Department
from app.models.academic_year import AcademicYear
from app.models.report import (
    ReportTemplate, ReportSection, DepartmentReport,
    Faculty, StudentStatistic, Research, Project, Event,
    Achievement, Placement, IndustryCollaboration, Infrastructure,
    ReportSubmissionHistory, ReportReviewComment, AuditLog, Notification
)
from app.core.security import get_password_hash

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Seeding database with realistic institutional data...")

    # 1. Admin Account
    admin = db.query(User).filter(User.email == "admin@institute.edu").first()
    if not admin:
        admin = User(
            email="admin@institute.edu",
            hashed_password=get_password_hash("Admin@123"),
            full_name="Dr. Rajesh Sharma (Director)",
            role="ADMIN",
            status="ACTIVE",
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # 2. Departments
    dept_definitions = [
        {"name": "Computer Science & Engineering", "short_code": "CSE", "head_of_department": "Dr. Ananya Roy", "email": "cse.hod@institute.edu", "phone": "+91-9876543210", "description": "Leading department in Artificial Intelligence, Cloud Computing, and Cybersecurity."},
        {"name": "Information Technology", "short_code": "IT", "head_of_department": "Dr. Suresh Nair", "email": "it.hod@institute.edu", "phone": "+91-9876543211", "description": "Excellence in software development, data analytics, and Internet of Things."},
        {"name": "Electronics & Communication", "short_code": "ECE", "head_of_department": "Dr. Vikram Patel", "email": "ece.hod@institute.edu", "phone": "+91-9876543212", "description": "Cutting-edge research in VLSI, Embedded Systems, and Wireless Communication."},
        {"name": "Mechanical Engineering", "short_code": "MECH", "head_of_department": "Dr. Manoj Kulkarni", "email": "mech.hod@institute.edu", "phone": "+91-9876543213", "description": "Pioneering in Robotics, Thermal Engineering, and Sustainable Manufacturing."},
        {"name": "Civil Engineering", "short_code": "CIVIL", "head_of_department": "Dr. Sunita Deshmukh", "email": "civil.hod@institute.edu", "phone": "+91-9876543214", "description": "Specialized in Smart Structural Engineering, Geotechnical Research, and Green Concrete."},
        {"name": "Commerce & Management", "short_code": "BCOM", "head_of_department": "Dr. Amitava Ghosh", "email": "bcom.hod@institute.edu", "phone": "+91-9876543215", "description": "Empowering students in Financial Markets, Business Analytics, and Corporate Strategy."}
    ]

    dept_map = {}
    for d_data in dept_definitions:
        dept = db.query(Department).filter(Department.short_code == d_data["short_code"]).first()
        if not dept:
            dept = Department(**d_data)
            db.add(dept)
            db.commit()
            db.refresh(dept)
        else:
            dept.head_of_department = d_data["head_of_department"]
            dept.description = d_data["description"]
            db.commit()
        dept_map[dept.short_code] = dept

    # 3. Department Users
    dept_user_credentials = [
        {"email": "cse@institute.edu", "full_name": "CSE Coordinator", "code": "CSE"},
        {"email": "it@institute.edu", "full_name": "IT Coordinator", "code": "IT"},
        {"email": "ece@institute.edu", "full_name": "ECE Coordinator", "code": "ECE"},
        {"email": "mech@institute.edu", "full_name": "MECH Coordinator", "code": "MECH"},
        {"email": "civil@institute.edu", "full_name": "CIVIL Coordinator", "code": "CIVIL"},
        {"email": "bcom@institute.edu", "full_name": "BCOM Coordinator", "code": "BCOM"},
    ]

    dept_users_map = {}
    for u_data in dept_user_credentials:
        user = db.query(User).filter(User.email == u_data["email"]).first()
        dept_id = dept_map[u_data["code"]].id
        if not user:
            user = User(
                email=u_data["email"],
                hashed_password=get_password_hash("Dept@123"),
                full_name=u_data["full_name"],
                role="DEPARTMENT",
                department_id=dept_id,
                status="ACTIVE",
                is_active=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.department_id = dept_id
            db.commit()
        dept_users_map[u_data["code"]] = user

    # 4. Academic Years
    # AY 2024-2025: Published
    ay_published = db.query(AcademicYear).filter(AcademicYear.name == "2024-2025").first()
    if not ay_published:
        ay_published = AcademicYear(
            name="2024-2025",
            start_date=date(2024, 7, 1),
            end_date=date(2025, 6, 30),
            submission_deadline=date(2025, 5, 15),
            status="PUBLISHED",
            description="Published Institute Annual Report for Academic Session 2024-25"
        )
        db.add(ay_published)
        db.commit()
        db.refresh(ay_published)

    # AY 2025-2026: Open
    ay_open = db.query(AcademicYear).filter(AcademicYear.name == "2025-2026").first()
    if not ay_open:
        ay_open = AcademicYear(
            name="2025-2026",
            start_date=date(2025, 7, 1),
            end_date=date(2026, 6, 30),
            submission_deadline=date(2026, 5, 31),
            status="OPEN",
            description="Current Active Reporting Cycle for 2025-2026"
        )
        db.add(ay_open)
        db.commit()
        db.refresh(ay_open)

    # 5. Report Template for 2025-2026
    tmpl = db.query(ReportTemplate).filter(ReportTemplate.academic_year_id == ay_open.id).first()
    if not tmpl:
        tmpl = ReportTemplate(
            academic_year_id=ay_open.id,
            name="Standard Institute Accreditation Template 2025-26",
            status="ACTIVE"
        )
        db.add(tmpl)
        db.commit()
        db.refresh(tmpl)

        from app.api.endpoints.templates import DEFAULT_SECTIONS
        for s in DEFAULT_SECTIONS:
            sec = ReportSection(template_id=tmpl.id, **s)
            db.add(sec)
        db.commit()

    # 6. Sample Reports & Data for Departments (2025-2026)
    # Statuses:
    # CSE: APPROVED
    # IT: APPROVED
    # ECE: UNDER_REVIEW
    # MECH: CORRECTION_REQUIRED
    # CIVIL: SUBMITTED
    # BCOM: DRAFT
    
    dept_configs = [
        {
            "code": "CSE",
            "status": "APPROVED",
            "feedback": "Outstanding performance in publications and high CTC placements. Report verified and approved.",
            "faculty": [
                {"name": "Dr. Ananya Roy", "designation": "Professor & HOD", "qualification": "Ph.D. IIT Bombay", "specialization": "Deep Learning & NLP", "experience_years": 16.0},
                {"name": "Dr. Sandeep Verma", "designation": "Associate Professor", "qualification": "Ph.D. IISc", "specialization": "Cybersecurity & Blockchain", "experience_years": 11.5},
                {"name": "Prof. Meera Sen", "designation": "Assistant Professor", "qualification": "M.Tech NIT Trichy", "specialization": "Distributed Systems", "experience_years": 6.0}
            ],
            "stats": {"total_students": 520, "male_students": 320, "female_students": 200, "ug_students": 440, "pg_students": 80, "graduating_students": 130},
            "research": [
                {"title": "Federated Multi-Agent Reinforcement Learning for Autonomous Drone Swarms", "authors": "Roy, A. and Sen, M.", "publication_type": "Journal", "journal_or_conference_name": "IEEE Trans. on Neural Networks", "year": 2025, "doi_link": "https://doi.org/10.1109/TNNLS.2025.1001"},
                {"title": "Zero-Knowledge Proofs in Decentralized Identity Verification", "authors": "Verma, S.", "publication_type": "Conference", "journal_or_conference_name": "ACM CCS 2025", "year": 2025, "doi_link": "https://doi.org/10.1145/3600000.123"}
            ],
            "projects": [
                {"title": "Autonomous Smart Campus Navigation Bot", "project_type": "Innovation", "student_names": "Rahul Sharma, Priya Nair", "faculty_guide": "Dr. Ananya Roy", "funding_amount": 250000.0, "description": "LiDAR-based navigation robot for indoor accessibility."}
            ],
            "events": [
                {"event_name": "National Hackathon on GenAI Solutions", "event_type": "Hackathon", "event_date": datetime(2025, 10, 14), "venue": "Campus Auditorium", "organizer": "CSE Dept & ACM Chapter", "participants_count": 450, "description": "36-hour hackathon with 100+ teams."}
            ],
            "achievements": [
                {"title": "First Prize at Smart India Hackathon 2025", "person_or_team": "Team NeuralBytes (CSE)", "category": "Student", "date": datetime(2025, 12, 1), "level": "National", "description": "Won national prize in software category."}
            ],
            "placement": {"eligible_students": 125, "placed_students": 118, "highest_package": 44.5, "average_package": 14.8, "lowest_package": 6.5, "companies_visited": 48},
            "collaborations": [
                {"company_name": "Microsoft India", "mou_signed": True, "date_signed": datetime(2025, 8, 10), "collaborative_activities": "Curriculum co-design and Cloud computing credits for students."}
            ],
            "infrastructures": [
                {"facility_name": "High Performance AI Supercomputing Lab", "lab_type": "Supercomputing", "major_equipment": "8x NVIDIA A100 GPUs, 512GB RAM Server", "cost": 4500000.0, "area_sqft": 1200.0}
            ]
        },
        {
            "code": "IT",
            "status": "APPROVED",
            "feedback": "Well-documented research outcomes and strong industry internships.",
            "faculty": [
                {"name": "Dr. Suresh Nair", "designation": "Professor & HOD", "qualification": "Ph.D. IIT Delhi", "specialization": "Cloud & Data Engineering", "experience_years": 18.0},
                {"name": "Dr. Priyanka Das", "designation": "Associate Professor", "qualification": "Ph.D. BITS Pilani", "specialization": "IoT & Big Data", "experience_years": 9.0}
            ],
            "stats": {"total_students": 480, "male_students": 290, "female_students": 190, "ug_students": 420, "pg_students": 60, "graduating_students": 110},
            "research": [
                {"title": "Edge-Assisted Sensor Fusion for Smart Agriculture IoT", "authors": "Nair, S. and Das, P.", "publication_type": "Journal", "journal_or_conference_name": "Elsevier Internet of Things", "year": 2025, "doi_link": "https://doi.org/10.1016/j.iot.2025.10098"}
            ],
            "projects": [
                {"title": "Automated Medical Drone Dispatch System", "project_type": "Capstone", "student_names": "Arjun Rao, Sneha Jain", "faculty_guide": "Dr. Suresh Nair", "funding_amount": 150000.0, "description": "Emergency supply routing across rural areas."}
            ],
            "events": [
                {"event_name": "International Workshop on Cloud Architectures", "event_type": "Workshop", "event_date": datetime(2025, 11, 20), "venue": "Virtual / Hybrid", "organizer": "IT Department", "participants_count": 280, "description": "Hands-on session on Kubernetes and microservices."}
            ],
            "achievements": [
                {"title": "Best Paper Award at IEEE INDICON 2025", "person_or_team": "Dr. Priyanka Das", "category": "Faculty", "date": datetime(2025, 11, 5), "level": "International", "description": "Recognized for novel edge-computing protocol."}
            ],
            "placement": {"eligible_students": 105, "placed_students": 96, "highest_package": 36.0, "average_package": 12.4, "lowest_package": 5.8, "companies_visited": 42},
            "collaborations": [
                {"company_name": "Amazon Web Services (AWS)", "mou_signed": True, "date_signed": datetime(2025, 7, 15), "collaborative_activities": "AWS Academy Cloud Architect certification training."}
            ],
            "infrastructures": [
                {"facility_name": "Internet of Things Innovation Lab", "lab_type": "IoT Lab", "major_equipment": "Raspberry Pi 5 clusters, LoRaWAN gateways, Sensor kits", "cost": 1800000.0, "area_sqft": 950.0}
            ]
        },
        {
            "code": "ECE",
            "status": "UNDER_REVIEW",
            "feedback": "Under administrative verification by Dean Academics.",
            "faculty": [
                {"name": "Dr. Vikram Patel", "designation": "Professor & HOD", "qualification": "Ph.D. IIT Kharagpur", "specialization": "Semiconductors & VLSI", "experience_years": 15.0},
                {"name": "Dr. Neha Kapoor", "designation": "Assistant Professor", "qualification": "Ph.D. NIT Warangal", "specialization": "RF & Microwave Engineering", "experience_years": 7.0}
            ],
            "stats": {"total_students": 450, "male_students": 270, "female_students": 180, "ug_students": 390, "pg_students": 60, "graduating_students": 100},
            "research": [
                {"title": "Low Power 5nm CMOS Sub-threshold Logic Architectures", "authors": "Patel, V. and Kapoor, N.", "publication_type": "Journal", "journal_or_conference_name": "IEEE Trans. on VLSI", "year": 2025, "doi_link": "https://doi.org/10.1109/TVLSI.2025.2001"}
            ],
            "projects": [
                {"title": "5G Beamforming Antenna Array", "project_type": "Sponsored Research", "student_names": "Karan Mehra", "faculty_guide": "Dr. Neha Kapoor", "funding_amount": 500000.0, "description": "ISRO sponsored project for satellite tracking."}
            ],
            "events": [
                {"event_name": "Cadence VLSI Toolchain Hands-on Training", "event_type": "Workshop", "event_date": datetime(2025, 9, 22), "venue": "CAD Lab", "organizer": "ECE Dept", "participants_count": 120, "description": "Analog design simulation workshop."}
            ],
            "achievements": [
                {"title": "Patent Granted for Millimeter Wave Sensor", "person_or_team": "Dr. Vikram Patel", "category": "Faculty", "date": datetime(2025, 10, 12), "level": "National", "description": "Indian Patent No. 452918"}
            ],
            "placement": {"eligible_students": 98, "placed_students": 84, "highest_package": 28.0, "average_package": 10.2, "lowest_package": 5.0, "companies_visited": 35},
            "collaborations": [
                {"company_name": "Texas Instruments", "mou_signed": True, "date_signed": datetime(2025, 9, 1), "collaborative_activities": "DSP laboratory sponsorship and student internships."}
            ],
            "infrastructures": [
                {"facility_name": "Advanced VLSI CAD Lab", "lab_type": "Simulation Lab", "major_equipment": "Cadence Virtuoso, Synopsys Design Compiler, 40 Workstations", "cost": 3200000.0, "area_sqft": 1100.0}
            ]
        },
        {
            "code": "MECH",
            "status": "CORRECTION_REQUIRED",
            "feedback": "Please update Section 8 (Placements): The placed student count does not tally with the company offer letters submitted. Also attach proof for the Solar Vehicle project.",
            "faculty": [
                {"name": "Dr. Manoj Kulkarni", "designation": "Professor & HOD", "qualification": "Ph.D. IIT Roorkee", "specialization": "Thermodynamics & CFD", "experience_years": 20.0},
                {"name": "Dr. Rakesh Joshi", "designation": "Associate Professor", "qualification": "Ph.D. VNIT", "specialization": "Mechatronics & Robotics", "experience_years": 12.0}
            ],
            "stats": {"total_students": 420, "male_students": 360, "female_students": 60, "ug_students": 380, "pg_students": 40, "graduating_students": 95},
            "research": [
                {"title": "Thermal Dissipation Analysis in High-Density EV Battery Packs", "authors": "Kulkarni, M.", "publication_type": "Conference", "journal_or_conference_name": "SAE World Congress", "year": 2025, "doi_link": "https://doi.org/10.4271/2025-01-0500"}
            ],
            "projects": [
                {"title": "Hybrid Solar-Electric All-Terrain Vehicle", "project_type": "Innovation", "student_names": "BAJA SAE Team", "faculty_guide": "Dr. Rakesh Joshi", "funding_amount": 300000.0, "description": "Student competition vehicle built for BAJA India."}
            ],
            "events": [
                {"event_name": "Seminar on Industry 4.0 and CNC Automation", "event_type": "Seminar", "event_date": datetime(2025, 8, 18), "venue": "Mechanical Seminar Hall", "organizer": "MECH Dept", "participants_count": 180, "description": "Guest lecture by Tata Motors Chief Engineer."}
            ],
            "achievements": [
                {"title": "Top 5 Finish at BAJA SAE India 2025", "person_or_team": "Team MechStallions", "category": "Student", "date": datetime(2025, 11, 28), "level": "National", "description": "Secured 4th rank nationally in acceleration challenge."}
            ],
            "placement": {"eligible_students": 90, "placed_students": 72, "highest_package": 18.5, "average_package": 7.8, "lowest_package": 4.5, "companies_visited": 28},
            "collaborations": [
                {"company_name": "Tata Motors Ltd.", "mou_signed": True, "date_signed": datetime(2025, 6, 12), "collaborative_activities": "Apprenticeship and joint automotive research."}
            ],
            "infrastructures": [
                {"facility_name": "Robotics & Automation Laboratory", "lab_type": "Robotics", "major_equipment": "KUKA 6-Axis Industrial Robotic Arm, 3D Printers", "cost": 5500000.0, "area_sqft": 1500.0}
            ]
        },
        {
            "code": "CIVIL",
            "status": "SUBMITTED",
            "feedback": None,
            "faculty": [
                {"name": "Dr. Sunita Deshmukh", "designation": "Professor & HOD", "qualification": "Ph.D. IIT Madras", "specialization": "Earthquake Engineering", "experience_years": 17.0},
                {"name": "Prof. Harish Chandra", "designation": "Assistant Professor", "qualification": "M.Tech IIT Roorkee", "specialization": "Hydraulics & Water Resources", "experience_years": 5.0}
            ],
            "stats": {"total_students": 360, "male_students": 250, "female_students": 110, "ug_students": 330, "pg_students": 30, "graduating_students": 80},
            "research": [
                {"title": "Seismic Resilience of Geopolymer Concrete Columns Under Cyclic Loading", "authors": "Deshmukh, S.", "publication_type": "Journal", "journal_or_conference_name": "ACI Structural Journal", "year": 2025, "doi_link": "https://doi.org/10.14359/5173000"}
            ],
            "projects": [
                {"title": "Smart Rainwater Harvesting & Greywater Recycling for Smart Cities", "project_type": "Consultancy", "student_names": "Nitin Goel, Pooja Saxena", "faculty_guide": "Prof. Harish Chandra", "funding_amount": 200000.0, "description": "Consultancy project for Municipal Corporation."}
            ],
            "events": [
                {"event_name": "National Workshop on Green Building Technologies", "event_type": "Workshop", "event_date": datetime(2025, 10, 5), "venue": "Civil Seminar Hall", "organizer": "Civil Dept & IGBC Chapter", "participants_count": 150, "description": "LEED and GRIHA rating systems certification workshop."}
            ],
            "achievements": [
                {"title": "IGBC Certified Green Campus Initiative", "person_or_team": "Civil Engineering Faculty Group", "category": "Department", "date": datetime(2025, 9, 15), "level": "National", "description": "Gold rating awarded to institute campus."}
            ],
            "placement": {"eligible_students": 75, "placed_students": 58, "highest_package": 12.0, "average_package": 6.8, "lowest_package": 4.2, "companies_visited": 22},
            "collaborations": [
                {"company_name": "Larsen & Toubro (L&T)", "mou_signed": True, "date_signed": datetime(2025, 8, 20), "collaborative_activities": "Site visits, geotechnical testing, and graduate trainee recruitment."}
            ],
            "infrastructures": [
                {"facility_name": "Soil Mechanics & Geotechnical Testing Lab", "lab_type": "Heavy Testing Lab", "major_equipment": "Triaxial Testing Machine, Direct Shear Apparatus, Shake Table", "cost": 2800000.0, "area_sqft": 1400.0}
            ]
        },
        {
            "code": "BCOM",
            "status": "DRAFT",
            "feedback": None,
            "faculty": [
                {"name": "Dr. Amitava Ghosh", "designation": "Professor & HOD", "qualification": "Ph.D. IIM Calcutta", "specialization": "Corporate Finance & Fintech", "experience_years": 19.0}
            ],
            "stats": {"total_students": 320, "male_students": 160, "female_students": 160, "ug_students": 280, "pg_students": 40, "graduating_students": 70},
            "research": [
                {"title": "Fintech Disruptions in Retail Banking: Empirical Evidence from India", "authors": "Ghosh, A.", "publication_type": "Journal", "journal_or_conference_name": "Journal of Financial Services Research", "year": 2025, "doi_link": "https://doi.org/10.1007/s10693-025-004"}
            ],
            "projects": [
                {"title": "Algorithmic Trading Simulation Platform", "project_type": "Capstone", "student_names": "Kavita Rao", "faculty_guide": "Dr. Amitava Ghosh", "funding_amount": 80000.0, "description": "Backtesting equity portfolio models."}
            ],
            "events": [
                {"event_name": "Annual Financial Literacy Summit", "event_type": "Conference", "event_date": datetime(2025, 11, 10), "venue": "Management Auditorium", "organizer": "Department of Commerce", "participants_count": 310, "description": "Keynote addresses by RBI and SEBI officials."}
            ],
            "achievements": [
                {"title": "National Winner at Bloomberg Financial Olympiad", "person_or_team": "Rohan Mehta", "category": "Student", "date": datetime(2025, 10, 25), "level": "National", "description": "Ranked 1st among 5,000 national collegiate participants."}
            ],
            "placement": {"eligible_students": 65, "placed_students": 54, "highest_package": 16.0, "average_package": 8.2, "lowest_package": 4.8, "companies_visited": 25},
            "collaborations": [
                {"company_name": "Deloitte India", "mou_signed": True, "date_signed": datetime(2025, 7, 22), "collaborative_activities": "Financial analytics training and internship placements."}
            ],
            "infrastructures": [
                {"facility_name": "Financial Analytics & Bloomberg Terminal Lab", "lab_type": "Computer Lab", "major_equipment": "4 Bloomberg Professional Terminals, 30 Workstations", "cost": 3800000.0, "area_sqft": 800.0}
            ]
        }
    ]

    for cfg in dept_configs:
        dept = dept_map[cfg["code"]]
        user = dept_users_map[cfg["code"]]

        # Find or create report for AY 2025-2026
        rep = db.query(DepartmentReport).filter(
            DepartmentReport.department_id == dept.id,
            DepartmentReport.academic_year_id == ay_open.id
        ).first()

        if not rep:
            rep = DepartmentReport(
                department_id=dept.id,
                academic_year_id=ay_open.id,
                status=cfg["status"],
                submission_date=datetime.now() - timedelta(days=5) if cfg["status"] != "DRAFT" else None,
                admin_feedback=cfg["feedback"],
                department_info={
                    "name": dept.name,
                    "short_code": dept.short_code,
                    "head_of_department": dept.head_of_department,
                    "email": dept.email,
                    "phone": dept.phone,
                    "overview": dept.description,
                    "vision": f"To be recognized globally for excellence in education and cutting-edge innovations in {dept.name}.",
                    "mission": f"To impart rigorous conceptual knowledge, foster ethical professionalism, and solve societal challenges through {dept.name}.",
                    "hod_message": f"Welcome to the Department of {dept.name}. Our students and faculty continue to break new ground."
                }
            )
            db.add(rep)
            db.commit()
            db.refresh(rep)
        else:
            rep.status = cfg["status"]
            rep.admin_feedback = cfg["feedback"]
            db.commit()

        # Clean existing sub-entities for idempotent seeding
        db.query(Faculty).filter(Faculty.department_report_id == rep.id).delete()
        db.query(StudentStatistic).filter(StudentStatistic.department_report_id == rep.id).delete()
        db.query(Research).filter(Research.department_report_id == rep.id).delete()
        db.query(Project).filter(Project.department_report_id == rep.id).delete()
        db.query(Event).filter(Event.department_report_id == rep.id).delete()
        db.query(Achievement).filter(Achievement.department_report_id == rep.id).delete()
        db.query(Placement).filter(Placement.department_report_id == rep.id).delete()
        db.query(IndustryCollaboration).filter(IndustryCollaboration.department_report_id == rep.id).delete()
        db.query(Infrastructure).filter(Infrastructure.department_report_id == rep.id).delete()

        # Add faculty
        for f in cfg["faculty"]:
            db.add(Faculty(department_report_id=rep.id, **f))

        # Add stats
        db.add(StudentStatistic(department_report_id=rep.id, **cfg["stats"]))

        # Add research
        for r in cfg["research"]:
            db.add(Research(department_report_id=rep.id, **r))

        # Add projects
        for p in cfg["projects"]:
            db.add(Project(department_report_id=rep.id, **p))

        # Add events
        for e in cfg["events"]:
            db.add(Event(department_report_id=rep.id, **e))

        # Add achievements
        for a in cfg["achievements"]:
            db.add(Achievement(department_report_id=rep.id, **a))

        # Add placement
        db.add(Placement(department_report_id=rep.id, **cfg["placement"]))

        # Add collaborations
        for c in cfg["collaborations"]:
            db.add(IndustryCollaboration(department_report_id=rep.id, **c))

        # Add infrastructure
        for inf in cfg["infrastructures"]:
            db.add(Infrastructure(department_report_id=rep.id, **inf))

        # Submission History
        hist = db.query(ReportSubmissionHistory).filter(ReportSubmissionHistory.department_report_id == rep.id).first()
        if not hist:
            db.add(ReportSubmissionHistory(
                department_report_id=rep.id,
                action="INITIALIZED",
                actor_id=user.id,
                notes="Department report initialized in portal"
            ))
            if cfg["status"] in ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "CORRECTION_REQUIRED"]:
                db.add(ReportSubmissionHistory(
                    department_report_id=rep.id,
                    action="SUBMITTED",
                    actor_id=user.id,
                    notes="Submitted for administrative review"
                ))
            if cfg["status"] in ["UNDER_REVIEW", "APPROVED", "CORRECTION_REQUIRED"]:
                db.add(ReportSubmissionHistory(
                    department_report_id=rep.id,
                    action=cfg["status"],
                    actor_id=admin.id,
                    notes=cfg["feedback"] or f"Report status changed to {cfg['status']}"
                ))

        # Also seed published AY 2024-2025 approved reports so public portal works immediately!
        pub_rep = db.query(DepartmentReport).filter(
            DepartmentReport.department_id == dept.id,
            DepartmentReport.academic_year_id == ay_published.id
        ).first()

        if not pub_rep:
            pub_rep = DepartmentReport(
                department_id=dept.id,
                academic_year_id=ay_published.id,
                status="APPROVED",
                submission_date=datetime(2025, 5, 10),
                admin_feedback="Approved for Annual Institute Publication",
                department_info={
                    "name": dept.name,
                    "short_code": dept.short_code,
                    "head_of_department": dept.head_of_department,
                    "email": dept.email,
                    "phone": dept.phone,
                    "overview": dept.description
                }
            )
            db.add(pub_rep)
            db.commit()
            db.refresh(pub_rep)

            # Add basic sub-entities for published report
            for f in cfg["faculty"][:2]:
                db.add(Faculty(department_report_id=pub_rep.id, **f))
            db.add(StudentStatistic(department_report_id=pub_rep.id, **cfg["stats"]))
            for r in cfg["research"][:1]:
                db.add(Research(department_report_id=pub_rep.id, **r))
            db.add(Placement(department_report_id=pub_rep.id, **cfg["placement"]))

        db.commit()

    # 7. Seed Notifications
    existing_notif = db.query(Notification).first()
    if not existing_notif:
        # Admin notification
        db.add(Notification(
            user_id=admin.id,
            title="New Submissions Received",
            message="Civil Engineering has submitted their annual report for 2025-2026.",
            type="INFO",
            link="/admin/reports"
        ))
        # Mechanical Department notification
        mech_user = dept_users_map["MECH"]
        db.add(Notification(
            user_id=mech_user.id,
            title="Correction Requested on Annual Report",
            message="Admin requested corrections on Section 8 (Placements). Please verify counts and resubmit.",
            type="WARNING",
            link="/department/report"
        ))
        db.commit()

    # 8. Seed Audit Logs
    existing_audit = db.query(AuditLog).first()
    if not existing_audit:
        db.add(AuditLog(
            user_id=admin.id,
            user_email="admin@institute.edu",
            action="LOGIN",
            entity="USER",
            entity_id=admin.id,
            details="Admin logged in from campus IP",
            ip_address="127.0.0.1"
        ))
        db.add(AuditLog(
            user_id=admin.id,
            user_email="admin@institute.edu",
            action="APPROVE",
            entity="REPORT",
            entity_id=1,
            details="Approved Computer Science annual report",
            ip_address="127.0.0.1"
        ))
        db.add(AuditLog(
            user_id=admin.id,
            user_email="admin@institute.edu",
            action="PUBLISH",
            entity="ACADEMIC_YEAR",
            entity_id=ay_published.id,
            details="Published 2024-2025 Institute Annual Report to public portal",
            ip_address="127.0.0.1"
        ))
        db.commit()

    db.close()
    print("Database seeded successfully with all 6 departments, demo users, reports, and audit trail.")

if __name__ == "__main__":
    seed_db()
