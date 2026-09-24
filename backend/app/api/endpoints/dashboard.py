from typing import Any, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    # Resolve Academic Year
    if not academic_year_id:
        active_ay = db.query(models.AcademicYear).filter(models.AcademicYear.status == "OPEN").first()
        if not active_ay:
            active_ay = db.query(models.AcademicYear).order_by(models.AcademicYear.start_date.desc()).first()
        academic_year_id = active_ay.id if active_ay else None

    total_departments = db.query(models.Department).filter(models.Department.status == "ACTIVE").count()
    total_users = db.query(models.User).filter(models.User.is_active == True).count()
    pending_registrations = db.query(models.User).filter(models.User.status == "PENDING").count()

    reports_query = db.query(models.DepartmentReport)
    if academic_year_id:
        reports_query = reports_query.filter(models.DepartmentReport.academic_year_id == academic_year_id)

    reports = reports_query.all()
    report_ids = [r.id for r in reports]

    total_reports = len(reports)
    draft_reports = sum(1 for r in reports if r.status == "DRAFT")
    submitted_reports = sum(1 for r in reports if r.status == "SUBMITTED")
    under_review_reports = sum(1 for r in reports if r.status == "UNDER_REVIEW")
    approved_reports = sum(1 for r in reports if r.status == "APPROVED")
    correction_reports = sum(1 for r in reports if r.status == "CORRECTION_REQUIRED")
    rejected_reports = sum(1 for r in reports if r.status == "REJECTED")

    reports_awaiting_review = submitted_reports + under_review_reports
    completion_rate = round((approved_reports / total_departments * 100) if total_departments > 0 else 0, 1)

    # Detailed aggregate metrics from report_ids
    total_faculty = 0
    total_students = 0
    total_ug_students = 0
    total_pg_students = 0
    total_graduating = 0
    total_male = 0
    total_female = 0
    total_publications = 0
    total_projects = 0
    total_events = 0
    total_achievements = 0
    total_eligible = 0
    total_placed = 0
    avg_packages = []
    highest_package = 0.0

    dept_stats = []

    if report_ids:
        total_faculty = db.query(models.Faculty).filter(models.Faculty.department_report_id.in_(report_ids)).count()
        
        student_stats = db.query(models.StudentStatistic).filter(models.StudentStatistic.department_report_id.in_(report_ids)).all()
        for s in student_stats:
            total_students += s.total_students or 0
            total_ug_students += s.ug_students or 0
            total_pg_students += s.pg_students or 0
            total_graduating += s.graduating_students or 0
            total_male += s.male_students or 0
            total_female += s.female_students or 0

        total_publications = db.query(models.Research).filter(models.Research.department_report_id.in_(report_ids)).count()
        total_projects = db.query(models.Project).filter(models.Project.department_report_id.in_(report_ids)).count()
        total_events = db.query(models.Event).filter(models.Event.department_report_id.in_(report_ids)).count()
        total_achievements = db.query(models.Achievement).filter(models.Achievement.department_report_id.in_(report_ids)).count()

        placements = db.query(models.Placement).filter(models.Placement.department_report_id.in_(report_ids)).all()
        for p in placements:
            total_eligible += p.eligible_students or 0
            total_placed += p.placed_students or 0
            if p.average_package and p.average_package > 0:
                avg_packages.append(p.average_package)
            if p.highest_package and p.highest_package > highest_package:
                highest_package = p.highest_package

        # Breakdown per department
        for r in reports:
            dept_name = r.department.name if r.department else f"Dept #{r.department_id}"
            dept_code = r.department.short_code if r.department else f"D{r.department_id}"
            fac_count = len(r.faculty)
            res_count = len(r.research)
            proj_count = len(r.projects)
            placed_ct = r.placement.placed_students if r.placement else 0
            eligible_ct = r.placement.eligible_students if r.placement else 0
            p_rate = round((placed_ct / eligible_ct * 100) if eligible_ct > 0 else 0, 1)

            # Calculate submission progress percentage based on sections filled
            sections_completed = 0
            if fac_count > 0: sections_completed += 1
            if r.student_statistics and (r.student_statistics.total_students or 0) > 0: sections_completed += 1
            if res_count > 0: sections_completed += 1
            if proj_count > 0: sections_completed += 1
            if len(r.events) > 0: sections_completed += 1
            if len(r.achievements) > 0: sections_completed += 1
            if r.placement and (r.placement.eligible_students or 0) > 0: sections_completed += 1
            
            progress_pct = round((sections_completed / 7) * 100) if sections_completed > 0 else (100 if r.status == 'APPROVED' else 15)

            dept_stats.append({
                "report_id": r.id,
                "department": dept_name,
                "code": dept_code,
                "status": r.status,
                "progress_percentage": progress_pct,
                "faculty": fac_count,
                "research": res_count,
                "projects": proj_count,
                "placed": placed_ct,
                "placement_rate": p_rate
            })

    overall_avg_package = round(sum(avg_packages) / len(avg_packages), 2) if avg_packages else 0.0
    overall_placement_rate = round((total_placed / total_eligible * 100) if total_eligible > 0 else 0, 1)

    # Recent Registrations
    recent_registrations = db.query(models.User).order_by(desc(models.User.created_at)).limit(5).all()

    # Recent Audit Logs
    recent_audit = db.query(models.AuditLog).order_by(desc(models.AuditLog.created_at)).limit(6).all()

    # Recent Department Activity (Submission histories)
    recent_histories = db.query(models.ReportSubmissionHistory).order_by(desc(models.ReportSubmissionHistory.timestamp)).limit(5).all()
    formatted_histories = []
    for h in recent_histories:
        rep = h.report
        dept_name = rep.department.short_code if rep and rep.department else "Dept"
        actor_name = h.actor.full_name if h.actor else "System"
        formatted_histories.append({
            "id": h.id,
            "action": h.action,
            "department": dept_name,
            "actor": actor_name,
            "notes": h.notes,
            "timestamp": h.timestamp
        })

    return {
        "academic_year_id": academic_year_id,
        "kpis": {
            "total_departments": total_departments,
            "total_users": total_users,
            "pending_registrations": pending_registrations,
            "total_reports": total_reports,
            "draft_reports": draft_reports,
            "submitted_reports": submitted_reports,
            "under_review_reports": under_review_reports,
            "reports_awaiting_review": reports_awaiting_review,
            "approved_reports": approved_reports,
            "correction_reports": correction_reports,
            "rejected_reports": rejected_reports,
            "completion_percentage": completion_rate,
            "total_faculty": total_faculty,
            "total_students": total_students,
            "total_ug_students": total_ug_students,
            "total_pg_students": total_pg_students,
            "total_graduating": total_graduating,
            "total_male": total_male,
            "total_female": total_female,
            "total_publications": total_publications,
            "total_projects": total_projects,
            "total_events": total_events,
            "total_achievements": total_achievements,
            "total_eligible_placements": total_eligible,
            "total_placed": total_placed,
            "overall_placement_rate": overall_placement_rate,
            "average_package_lpa": overall_avg_package,
            "highest_package_lpa": highest_package,
        },
        "status_distribution": [
            {"name": "Draft", "value": draft_reports, "color": "#94a3b8"},
            {"name": "Submitted", "value": submitted_reports, "color": "#3b82f6"},
            {"name": "Under Review", "value": under_review_reports, "color": "#f59e0b"},
            {"name": "Correction Required", "value": correction_reports, "color": "#ef4444"},
            {"name": "Approved", "value": approved_reports, "color": "#10b981"},
            {"name": "Rejected", "value": rejected_reports, "color": "#64748b"}
        ],
        "department_metrics": dept_stats,
        "recent_registrations": [schemas.User.model_validate(u) for u in recent_registrations],
        "recent_audit": [
            {
                "id": a.id,
                "action": a.action,
                "entity": a.entity,
                "user_email": a.user_email,
                "details": a.details,
                "created_at": a.created_at
            }
            for a in recent_audit
        ],
        "recent_activity": formatted_histories
    }
