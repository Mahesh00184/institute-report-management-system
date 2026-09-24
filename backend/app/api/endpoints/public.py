from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.db.session import get_db
from app.services.pdf_service import generate_annual_report_pdf

router = APIRouter()

@router.get("/academic-years", response_model=List[schemas.AcademicYear])
def get_published_academic_years(
    db: Session = Depends(get_db)
) -> Any:
    """
    Returns only academic years whose status is PUBLISHED.
    Draft, open, or internal years are strictly excluded.
    """
    years = db.query(models.AcademicYear).filter(
        models.AcademicYear.status == "PUBLISHED"
    ).order_by(models.AcademicYear.start_date.desc()).all()
    return years

@router.get("/reports/{academic_year_id}")
def get_public_annual_report(
    academic_year_id: int,
    db: Session = Depends(get_db)
) -> Any:
    # Strictly ensure the academic year itself is PUBLISHED
    academic_year = db.query(models.AcademicYear).filter(
        models.AcademicYear.id == academic_year_id,
        models.AcademicYear.status == "PUBLISHED"
    ).first()
    
    if not academic_year:
        raise HTTPException(
            status_code=404,
            detail="Public report not found or has not been published yet."
        )

    # Only APPROVED departmental reports are visible
    approved_reports = db.query(models.DepartmentReport).filter(
        models.DepartmentReport.academic_year_id == academic_year_id,
        models.DepartmentReport.status == "APPROVED"
    ).all()

    total_faculty = 0
    total_students = 0
    ug_students = 0
    pg_students = 0
    graduating_students = 0
    male_students = 0
    female_students = 0
    total_publications = 0
    total_projects = 0
    total_events = 0
    total_achievements = 0
    total_eligible = 0
    total_placed = 0
    avg_packages = []
    highest_package = 0.0

    departments_summary = []

    for r in approved_reports:
        dept = r.department
        dept_name = dept.name if dept else f"Department #{r.department_id}"
        dept_code = dept.short_code if dept else f"D{r.department_id}"

        fac_count = len(r.faculty)
        total_faculty += fac_count

        if r.student_statistics:
            st = r.student_statistics
            total_students += st.total_students or 0
            ug_students += st.ug_students or 0
            pg_students += st.pg_students or 0
            graduating_students += st.graduating_students or 0
            male_students += st.male_students or 0
            female_students += st.female_students or 0

        total_publications += len(r.research)
        total_projects += len(r.projects)
        total_events += len(r.events)
        total_achievements += len(r.achievements)

        if r.placement:
            pl = r.placement
            total_eligible += pl.eligible_students or 0
            total_placed += pl.placed_students or 0
            if pl.average_package and pl.average_package > 0:
                avg_packages.append(pl.average_package)
            if pl.highest_package and pl.highest_package > highest_package:
                highest_package = pl.highest_package

        departments_summary.append({
            "department_name": dept_name,
            "department_code": dept_code,
            "head_of_department": dept.head_of_department if dept else "N/A",
            "department_info": r.department_info,
            "faculty_count": fac_count,
            "publications_count": len(r.research),
            "projects_count": len(r.projects),
            "events_count": len(r.events),
            "placements": {
                "placed": r.placement.placed_students if r.placement else 0,
                "highest_package": r.placement.highest_package if r.placement else 0.0,
                "average_package": r.placement.average_package if r.placement else 0.0
            } if r.placement else None,
            "faculty": [schemas.Faculty.model_validate(f).model_dump() for f in r.faculty],
            "research": [schemas.Research.model_validate(res).model_dump() for res in r.research],
            "events": [schemas.Event.model_validate(ev).model_dump() for ev in r.events],
            "achievements": [schemas.Achievement.model_validate(ac).model_dump() for ac in r.achievements],
        })

    overall_avg_package = round(sum(avg_packages) / len(avg_packages), 2) if avg_packages else 0.0
    overall_placement_rate = round((total_placed / total_eligible * 100) if total_eligible > 0 else 0, 1)

    return {
        "academic_year_id": academic_year_id,
        "academic_year_name": academic_year.name,
        "status": "PUBLISHED",
        "approved_departments_count": len(approved_reports),
        "institute_totals": {
            "total_faculty": total_faculty,
            "total_students": total_students,
            "ug_students": ug_students,
            "pg_students": pg_students,
            "graduating_students": graduating_students,
            "male_students": male_students,
            "female_students": female_students,
            "total_publications": total_publications,
            "total_projects": total_projects,
            "total_events": total_events,
            "total_achievements": total_achievements,
            "total_eligible_placements": total_eligible,
            "total_placed": total_placed,
            "placement_rate": overall_placement_rate,
            "average_package": overall_avg_package,
            "highest_package": highest_package,
        },
        "departments": departments_summary
    }

@router.get("/reports/{academic_year_id}/pdf")
def download_public_pdf(
    academic_year_id: int,
    db: Session = Depends(get_db)
):
    # Retrieve public aggregate data
    report_data = get_public_annual_report(academic_year_id=academic_year_id, db=db)
    
    pdf_buffer = generate_annual_report_pdf(
        academic_year_name=report_data["academic_year_name"],
        aggregated_data=report_data,
        custom_title="OFFICIAL ANNUAL REPORT"
    )

    filename = f"Institute_Annual_Report_{report_data['academic_year_name']}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )
