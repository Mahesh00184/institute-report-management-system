# Institute Annual Report Portal

A centralized, automated, and audit-governed portal for compiling, verifying, aggregating, and publishing Higher Education Institute Annual Reports.

---

## 🏛️ System Architecture

- **Backend**: FastAPI, SQLAlchemy, SQLite (`annual_report.db`), Pydantic v2, ReportLab PDF Engine, JWT Authentication (`python-jose`, `passlib`).
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts.
- **Workflow Pipeline**: 
  `DRAFT` → `SUBMITTED` → `UNDER REVIEW` → `CORRECTION REQUIRED` / `REJECTED` / `APPROVED` → `RESUBMITTED` → `APPROVED` → `PUBLISHED`.

---

## 🚀 Key Implemented Features (Phases 1 — 14)

1. **Admin CRUD & Role-Based Access (Phase 1)**:
   - Department management with full CRUD and safeguards.
   - User account management with password reset, role assignment (`ADMIN`, `DEPARTMENT`, `VIEWER`), and department mapping.
   - Academic Year lifecycle (`DRAFT`, `OPEN`, `SUBMISSION_CLOSED`, `UNDER_COMPILATION`, `PUBLISHED`, `ARCHIVED`).

2. **Report Workflow Backend (Phase 2)**:
   - `/api/reports/` endpoints for initialization, draft auto-saving, submission, and status management.
   - Strict department isolation: Department users can only access their assigned department's data.

3. **Department Report Portal (Phase 3)**:
   - Multi-step report wizard covering 12 sections:
     1. Department Information (HOD profile, overview, vision, mission)
     2. Faculty Roster & Qualifications
     3. Student Statistics (Gender & program distributions)
     4. Research & Publications (Journals, Conferences, Patents, Book Chapters)
     5. Student Projects & Grants
     6. Events, Conferences & Workshops
     7. Achievements & National Honors
     8. Placements & Corporate Recruitment
     9. Industry Collaborations & MoUs
     10. Laboratories & Computing Infrastructure
     11. Supporting Verification Documents
     12. Certification & Submission Checklist
   - Progress bar, draft saving, and feedback banners for corrections.

4. **Admin Review Interface (Phase 4)**:
   - Filter submissions by Academic Year, Department, and Status.
   - Detailed inspection drawer with all 12 section tabs.
   - One-click actions: Under Review, Request Correction (with remarks), Approve, Reject.

5. **Analytics & Dashboard (Phase 5)**:
   - Dynamic metrics calculated in real-time from database records via `/api/dashboard/stats`.
   - Recharts visual charts: Status workflow breakdown (Donut) and Department publication output comparison (Bar chart).

6. **Central Aggregation Engine (Phase 6)**:
   - Aggregates **ONLY APPROVED** department reports for the selected academic year.
   - Computes institute-wide totals (faculty, enrolled students, research publications, average package, placement rate).

7. **Report Template Builder (Phase 7)**:
   - Customizable section titles, descriptions, order, mandatory/optional toggles, and enable/disable flags.
   - Snapshot protection so changes do not corrupt historical reports.

8. **Annual Report Builder & Document Preview (Phase 8)**:
   - Select Academic Year and toggle included approved departments.
   - Configure institute cover details and view document-style preview.

9. **High-Resolution PDF Generation (Phase 9)**:
   - ReportLab vector PDF generator with custom `NumberedCanvas` ("Page X of Y", running headers & footers).
   - Generates `Institute_Annual_Report_<academic_year>.pdf`.

10. **Public Portal (Phase 10)**:
    - Public access restricted strictly to academic years marked `PUBLISHED`.
    - Online interactive report view and official PDF download.

11. **In-App Notifications (Phase 11)**:
    - Database-driven notifications for submissions, resubmissions, correction notices, and approvals.

12. **Audit Logging (Phase 12)**:
    - Comprehensive audit trail recording user logins, report status transitions, updates, template edits, and PDF generations.

13. **Demo Data Seeding (Phase 13)**:
    - Seed data covering 6 departments (CSE, IT, ECE, MECH, CIVIL, BCOM), users, and varied report statuses.

14. **Automated Testing (Phase 14)**:
    - Complete workflow test suite in `backend/test_complete_workflow.py` verifying all 14 steps end-to-end.

---

## 🔑 Demo Credentials

| Role | Email | Password | Assigned Department |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@institute.edu` | `Admin@123` | System-wide Authority |
| **Dept Coordinator** | `cse@institute.edu` | `Dept@123` | Computer Science & Engg |
| **Dept Coordinator** | `it@institute.edu` | `Dept@123` | Information Technology |
| **Dept Coordinator** | `ece@institute.edu` | `Dept@123` | Electronics & Comm |
| **Dept Coordinator** | `mech@institute.edu` | `Dept@123` | Mechanical Engineering |
| **Dept Coordinator** | `civil@institute.edu` | `Dept@123` | Civil Engineering |
| **Dept Coordinator** | `bcom@institute.edu` | `Dept@123` | Commerce & Management |

---

## 💻 How to Run Locally

### 1. Start the Backend API Server
```bash
cd backend
.\venv\Scripts\activate
# (Optional) Re-seed fresh demo data:
python seed.py

# Start FastAPI dev server on port 8000:
uvicorn app.main:app --reload --port 8000
```
- **API Health Check**: `http://localhost:8000/api/health`
- **Interactive Swagger Documentation**: `http://localhost:8000/docs`

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- **Frontend Portal**: `http://localhost:5173`

---

## 🧪 Running Automated Tests

Run the complete 14-step integration test:
```bash
cd backend
.\venv\Scripts\python test_complete_workflow.py
```
