import sqlite3
import os
from app.db.base import Base
from app.db.session import engine
from app.models import InstituteSettings, User

def migrate_database():
    db_path = os.path.join(os.path.dirname(__file__), "annual_report.db")
    print(f"Connecting to database at {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Inspect existing columns in users table
    cursor.execute("PRAGMA table_info(users)")
    existing_columns = {row[1] for row in cursor.fetchall()}
    print(f"Existing columns in 'users': {existing_columns}")

    columns_to_add = [
        ("staff_id", "VARCHAR"),
        ("phone", "VARCHAR"),
        ("designation", "VARCHAR"),
        ("status", "VARCHAR DEFAULT 'ACTIVE'"),
        ("rejection_reason", "TEXT"),
        ("profile_image", "VARCHAR"),
        ("last_login", "DATETIME"),
        ("reset_token", "VARCHAR"),
        ("reset_token_expires", "DATETIME")
    ]

    for col_name, col_type in columns_to_add:
        if col_name not in existing_columns:
            print(f"Adding column '{col_name}' to 'users' table...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")

    # Ensure all seeded users and accounts without status have status='ACTIVE'
    cursor.execute("UPDATE users SET status = 'ACTIVE' WHERE status IS NULL OR status = '' OR email IN ('admin@institute.edu', 'cse@institute.edu', 'it@institute.edu', 'ece@institute.edu', 'mech@institute.edu', 'civil@institute.edu', 'bcom@institute.edu')")

    # Set staff_ids for existing users if missing
    cursor.execute("UPDATE users SET staff_id = 'ADM-001', designation = 'Director' WHERE email = 'admin@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'CSE-001', designation = 'Associate Professor' WHERE email = 'cse@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'IT-001', designation = 'Assistant Professor' WHERE email = 'it@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'ECE-001', designation = 'Professor' WHERE email = 'ece@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'MECH-001', designation = 'Assistant Professor' WHERE email = 'mech@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'CIVIL-001', designation = 'Associate Professor' WHERE email = 'civil@institute.edu' AND (staff_id IS NULL OR staff_id = '')")
    cursor.execute("UPDATE users SET staff_id = 'BCOM-001', designation = 'Associate Professor' WHERE email = 'bcom@institute.edu' AND (staff_id IS NULL OR staff_id = '')")

    # Create indexes for commonly searched fields if they don't exist
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_staff_id ON users (staff_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_users_status ON users (status)")

    conn.commit()
    conn.close()

    # 2. Create tables that might not exist yet (such as institute_settings)
    Base.metadata.create_all(bind=engine)
    print("Base metadata tables created / verified.")

    # 3. Initialize default InstituteSettings if not exists
    from app.db.session import SessionLocal
    db = SessionLocal()
    settings = db.query(InstituteSettings).first()
    if not settings:
        settings = InstituteSettings(
            institute_name="National Institute of Technology & Management",
            logo_url="/logo.png",
            address="Academic Ridge, Knowledge City, New Delhi 110001",
            email="registrar@institute.edu",
            phone="+91-11-23456789",
            website="https://institute.edu",
            report_naming_format="AR_{YEAR}_{DEPT}"
        )
        db.add(settings)
        db.commit()
        print("Default institute settings initialized.")
    db.close()

    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate_database()
