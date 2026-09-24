from typing import Any, List, Dict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app import models
from app.api import deps

router = APIRouter()

@router.get("/")
def global_search(
    q: str = Query(..., min_length=2),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Search across Departments, Users, Reports, Faculty, Projects, Events, and Achievements.
    Categorized output with direct links.
    """
    term = f"%{q.strip()}%"
    results = {
        "departments": [],
        "users": [],
        "reports": [],
        "faculty": [],
        "projects": [],
        "events": [],
        "achievements": []
    }

    # 1. Departments
    depts = db.query(models.Department).filter(
        or_(
            models.Department.name.ilike(term),
            models.Department.short_code.ilike(term),
            models.Department.head_of_department.ilike(term)
        )
    ).limit(5).all()
    for d in depts:
        results["departments"].append({
            "id": d.id,
            "title": f"{d.name} ({d.short_code})",
            "subtitle": f"HOD: {d.head_of_department}",
            "link": "/admin/departments" if current_user.role == "ADMIN" else "/department/dashboard"
        })

    # 2. Users (Admin only for full list, or colleagues)
    if current_user.role == "ADMIN":
        users = db.query(models.User).filter(
            or_(
                models.User.full_name.ilike(term),
                models.User.email.ilike(term),
                models.User.staff_id.ilike(term),
                models.User.designation.ilike(term)
            )
        ).limit(5).all()
        for u in users:
            results["users"].append({
                "id": u.id,
                "title": u.full_name,
                "subtitle": f"{u.designation or u.role} • {u.email}",
                "status": u.status,
                "link": f"/admin/users?q={u.email}"
            })

    # 3. Reports
    report_query = db.query(models.DepartmentReport).join(models.Department).join(models.AcademicYear)
    if current_user.role != "ADMIN" and current_user.department_id:
        report_query = report_query.filter(models.DepartmentReport.department_id == current_user.department_id)

    reports = report_query.filter(
        or_(
            models.Department.name.ilike(term),
            models.Department.short_code.ilike(term),
            models.AcademicYear.name.ilike(term),
            models.DepartmentReport.status.ilike(term)
        )
    ).limit(5).all()
    for r in reports:
        results["reports"].append({
            "id": r.id,
            "title": f"{r.department.name} - Annual Report ({r.academic_year.name})",
            "subtitle": f"Status: {r.status}",
            "link": f"/admin/reports/{r.id}" if current_user.role == "ADMIN" else "/department/report"
        })

    # 4. Faculty
    faculty_items = db.query(models.Faculty).filter(
        or_(
            models.Faculty.name.ilike(term),
            models.Faculty.designation.ilike(term),
            models.Faculty.specialization.ilike(term)
        )
    ).limit(5).all()
    for f in faculty_items:
        dept_name = f.report.department.short_code if f.report and f.report.department else "Dept"
        results["faculty"].append({
            "id": f.id,
            "title": f.name,
            "subtitle": f"{f.designation} ({dept_name}) • {f.specialization or ''}",
            "link": f"/admin/reports/{f.department_report_id}" if current_user.role == "ADMIN" else "/department/report"
        })

    # 5. Projects
    projects = db.query(models.Project).filter(
        or_(
            models.Project.title.ilike(term),
            models.Project.faculty_guide.ilike(term),
            models.Project.student_names.ilike(term)
        )
    ).limit(5).all()
    for p in projects:
        results["projects"].append({
            "id": p.id,
            "title": p.title,
            "subtitle": f"Type: {p.project_type} • Guide: {p.faculty_guide or 'N/A'}",
            "link": f"/admin/reports/{p.department_report_id}" if current_user.role == "ADMIN" else "/department/report"
        })

    # 6. Events
    events = db.query(models.Event).filter(
        or_(
            models.Event.event_name.ilike(term),
            models.Event.event_type.ilike(term),
            models.Event.venue.ilike(term)
        )
    ).limit(5).all()
    for e in events:
        results["events"].append({
            "id": e.id,
            "title": e.event_name,
            "subtitle": f"{e.event_type} • {e.venue or 'Institute'}",
            "link": f"/admin/reports/{e.department_report_id}" if current_user.role == "ADMIN" else "/department/report"
        })

    # 7. Achievements
    achievements = db.query(models.Achievement).filter(
        or_(
            models.Achievement.title.ilike(term),
            models.Achievement.person_or_team.ilike(term)
        )
    ).limit(5).all()
    for a in achievements:
        results["achievements"].append({
            "id": a.id,
            "title": a.title,
            "subtitle": f"{a.category} • {a.person_or_team} ({a.level})",
            "link": f"/admin/reports/{a.department_report_id}" if current_user.role == "ADMIN" else "/department/report"
        })

    total_results = sum(len(items) for items in results.values())
    return {
        "query": q,
        "total_results": total_results,
        "results": results
    }
