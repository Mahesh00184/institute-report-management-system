from datetime import datetime, timezone, timedelta
from app.db.session import SessionLocal
from app.models.user import User
from app.models.department import Department
from app.core.security import get_password_hash

def seed_sample_registrations():
    db = SessionLocal()
    print("Seeding sample user registrations for review...")

    cse_dept = db.query(Department).filter(Department.short_code == "CSE").first()
    it_dept = db.query(Department).filter(Department.short_code == "IT").first()
    mech_dept = db.query(Department).filter(Department.short_code == "MECH").first()

    samples = [
        {
            "email": "meera.nambiar@institute.edu",
            "full_name": "Dr. Meera Nambiar",
            "role": "DEPARTMENT",
            "status": "PENDING",
            "department_id": cse_dept.id if cse_dept else 1,
            "staff_id": "CSE-FAC-108",
            "phone": "+91-9876501234",
            "designation": "Associate Professor",
            "is_active": False,
            "created_at": datetime.now(timezone.utc) - timedelta(hours=3)
        },
        {
            "email": "rahul.saxena@institute.edu",
            "full_name": "Prof. Rahul Saxena",
            "role": "FACULTY",
            "status": "PENDING",
            "department_id": it_dept.id if it_dept else 2,
            "staff_id": "IT-FAC-204",
            "phone": "+91-9876505678",
            "designation": "Assistant Professor",
            "is_active": False,
            "created_at": datetime.now(timezone.utc) - timedelta(days=1)
        },
        {
            "email": "priya.sharma@institute.edu",
            "full_name": "Dr. Priya Sharma",
            "role": "FACULTY",
            "status": "PENDING",
            "department_id": mech_dept.id if mech_dept else 4,
            "staff_id": "MECH-FAC-312",
            "phone": "+91-9876509988",
            "designation": "Research Scientist",
            "is_active": False,
            "created_at": datetime.now(timezone.utc) - timedelta(days=2)
        }
    ]

    for s in samples:
        existing = db.query(User).filter(User.email == s["email"]).first()
        if not existing:
            u = User(
                email=s["email"],
                hashed_password=get_password_hash("Welcome@123"),
                full_name=s["full_name"],
                role=s["role"],
                status=s["status"],
                department_id=s["department_id"],
                staff_id=s["staff_id"],
                phone=s["phone"],
                designation=s["designation"],
                is_active=s["is_active"],
                created_at=s["created_at"]
            )
            db.add(u)
            print(f"Added pending registration: {s['email']}")

    db.commit()
    db.close()
    print("Sample registrations seeded successfully!")

if __name__ == "__main__":
    seed_sample_registrations()
