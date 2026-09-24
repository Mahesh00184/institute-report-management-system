import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "annual_report.db")
    print(f"Connecting to database at {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_column_if_not_exists(table, col_name, col_type):
        cursor.execute(f"PRAGMA table_info({table})")
        existing_cols = {row[1] for row in cursor.fetchall()}
        if col_name not in existing_cols:
            print(f"Adding column '{col_name}' to '{table}'...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_type}")

    # 1. faculty
    add_column_if_not_exists("faculty", "employee_id", "VARCHAR")
    add_column_if_not_exists("faculty", "email", "VARCHAR")
    add_column_if_not_exists("faculty", "phone", "VARCHAR")
    add_column_if_not_exists("faculty", "joining_date", "VARCHAR")
    add_column_if_not_exists("faculty", "research_interests", "TEXT")

    # 2. research
    add_column_if_not_exists("research", "indexing", "VARCHAR")
    add_column_if_not_exists("research", "publisher", "VARCHAR")
    add_column_if_not_exists("research", "publication_date", "VARCHAR")

    # 3. projects
    add_column_if_not_exists("projects", "category", "VARCHAR")
    add_column_if_not_exists("projects", "client", "VARCHAR")
    add_column_if_not_exists("projects", "start_date", "VARCHAR")
    add_column_if_not_exists("projects", "end_date", "VARCHAR")
    add_column_if_not_exists("projects", "status", "VARCHAR DEFAULT 'Completed'")
    add_column_if_not_exists("projects", "outcome", "TEXT")
    add_column_if_not_exists("projects", "project_url", "VARCHAR")

    # Ensure existing projects have status = 'Completed' if null
    cursor.execute("UPDATE projects SET status = 'Completed' WHERE status IS NULL OR status = ''")

    # 4. events
    add_column_if_not_exists("events", "coordinator", "VARCHAR")
    add_column_if_not_exists("events", "outcome", "TEXT")
    add_column_if_not_exists("events", "external_participants", "INTEGER DEFAULT 0")
    add_column_if_not_exists("events", "supporting_doc_url", "VARCHAR")

    # 5. achievements
    add_column_if_not_exists("achievements", "award_name", "VARCHAR")
    add_column_if_not_exists("achievements", "organization", "VARCHAR")
    add_column_if_not_exists("achievements", "supporting_doc_url", "VARCHAR")

    # 6. placements
    add_column_if_not_exists("placements", "major_recruiters", "TEXT")
    add_column_if_not_exists("placements", "higher_studies_count", "INTEGER DEFAULT 0")
    add_column_if_not_exists("placements", "entrepreneurship_count", "INTEGER DEFAULT 0")

    # 7. industry_collaborations
    add_column_if_not_exists("industry_collaborations", "collaboration_type", "VARCHAR DEFAULT 'Industry'")
    add_column_if_not_exists("industry_collaborations", "mou_number", "VARCHAR")
    add_column_if_not_exists("industry_collaborations", "end_date", "VARCHAR")
    add_column_if_not_exists("industry_collaborations", "contact_person", "VARCHAR")
    add_column_if_not_exists("industry_collaborations", "contact_email", "VARCHAR")
    add_column_if_not_exists("industry_collaborations", "outcome", "TEXT")
    add_column_if_not_exists("industry_collaborations", "status", "VARCHAR DEFAULT 'Active'")

    # 8. infrastructure
    add_column_if_not_exists("infrastructure", "facility_type", "VARCHAR DEFAULT 'Laboratories'")
    add_column_if_not_exists("infrastructure", "quantity", "INTEGER DEFAULT 1")
    add_column_if_not_exists("infrastructure", "capacity", "INTEGER DEFAULT 30")
    add_column_if_not_exists("infrastructure", "condition", "VARCHAR DEFAULT 'Good'")
    add_column_if_not_exists("infrastructure", "remarks", "TEXT")

    # 9. research_projects table (for Section 4: Research Projects vs Section 5: Department Projects)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS research_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_report_id INTEGER NOT NULL REFERENCES department_reports(id) ON DELETE CASCADE,
            title VARCHAR NOT NULL,
            principal_investigator VARCHAR,
            funding_agency VARCHAR,
            funding_amount FLOAT DEFAULT 0.0,
            start_date VARCHAR,
            end_date VARCHAR,
            status VARCHAR DEFAULT 'Ongoing'
        )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_research_projects_rep_id ON research_projects(department_report_id)")

    conn.commit()
    conn.close()
    print("Report tables migration completed successfully!")

if __name__ == "__main__":
    migrate()
