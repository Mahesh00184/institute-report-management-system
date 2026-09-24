import os
import shutil
from typing import Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.audit_service import log_audit, create_notification, notify_all_admins
from app.services.pdf_service import generate_annual_report_pdf

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def verify_report_access(report: models.DepartmentReport, current_user: models.User):
    if current_user.role == "ADMIN":
        return
    if current_user.role == "DEPARTMENT":
        if current_user.department_id != report.department_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only access your own department's reports."
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to access this report."
        )

def enrich_report_response(report: models.DepartmentReport) -> schemas.DepartmentReport:
    # Set helper names
    resp = schemas.DepartmentReport.model_validate(report)
    if report.department:
        resp.department_name = report.department.name
        resp.department_code = report.department.short_code
    if report.academic_year:
        resp.academic_year_name = report.academic_year.name
    for comment in resp.review_comments:
        user = next((c.user for c in report.review_comments if c.id == comment.id), None)
        if user:
            comment.user_name = user.full_name or user.email
    for hist in resp.history:
        actor = next((h.actor for h in report.history if h.id == hist.id), None)
        if actor:
            hist.actor_name = actor.full_name or actor.email
    return resp

@router.get("/", response_model=List[schemas.DepartmentReport])
def list_reports(
    db: Session = Depends(deps.get_db),
    academic_year_id: Optional[int] = None,
    department_id: Optional[int] = None,
    report_status: Optional[str] = None,
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(models.DepartmentReport)
    
    # Department users only see their own department
    if current_user.role == "DEPARTMENT":
        if not current_user.department_id:
            raise HTTPException(status_code=400, detail="User is not assigned to any department.")
        query = query.filter(models.DepartmentReport.department_id == current_user.department_id)
    elif department_id:
        query = query.filter(models.DepartmentReport.department_id == department_id)

    if academic_year_id:
        query = query.filter(models.DepartmentReport.academic_year_id == academic_year_id)
    if report_status:
        query = query.filter(models.DepartmentReport.status == report_status)

    reports = query.order_by(models.DepartmentReport.last_updated.desc()).all()
    return [enrich_report_response(r) for r in reports]

@router.get("/my-report", response_model=schemas.DepartmentReport)
def get_or_create_my_report(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_department_user),
) -> Any:
    if not current_user.department_id:
        raise HTTPException(status_code=400, detail="You are not assigned to any department.")

    # Find active academic year if not provided
    if not academic_year_id:
        active_ay = db.query(models.AcademicYear).filter(
            models.AcademicYear.status == "OPEN"
        ).order_by(models.AcademicYear.start_date.desc()).first()
        if not active_ay:
            # Fall back to latest academic year
            active_ay = db.query(models.AcademicYear).order_by(models.AcademicYear.start_date.desc()).first()
            if not active_ay:
                raise HTTPException(status_code=400, detail="No academic year exists. Please contact administrator.")
        academic_year_id = active_ay.id

    report = db.query(models.DepartmentReport).filter(
        models.DepartmentReport.department_id == current_user.department_id,
        models.DepartmentReport.academic_year_id == academic_year_id
    ).first()

    if not report:
        # Auto-create draft report
        dept = db.query(models.Department).filter(models.Department.id == current_user.department_id).first()
        report = models.DepartmentReport(
            department_id=current_user.department_id,
            academic_year_id=academic_year_id,
            status="DRAFT",
            department_info={
                "name": dept.name if dept else "",
                "short_code": dept.short_code if dept else "",
                "head_of_department": dept.head_of_department if dept else "",
                "email": dept.email if dept else "",
                "phone": dept.phone if dept else "",
                "overview": dept.description if dept else "",
                "vision": "",
                "mission": "",
                "hod_message": ""
            }
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        # Log history
        history = models.ReportSubmissionHistory(
            department_report_id=report.id,
            action="CREATED",
            actor_id=current_user.id,
            notes="Report draft initialized"
        )
        db.add(history)
        db.commit()
        db.refresh(report)

    return enrich_report_response(report)

@router.get("/aggregate/{academic_year_id}")
def get_aggregate_annual_report(
    academic_year_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    academic_year = db.query(models.AcademicYear).filter(models.AcademicYear.id == academic_year_id).first()
    if not academic_year:
        raise HTTPException(status_code=404, detail="Academic Year not found")

    # RULE: Only APPROVED reports are included in the institute annual report compilation!
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

        # Faculty
        fac_count = len(r.faculty)
        total_faculty += fac_count

        # Students
        if r.student_statistics:
            st = r.student_statistics
            total_students += st.total_students or 0
            ug_students += st.ug_students or 0
            pg_students += st.pg_students or 0
            graduating_students += st.graduating_students or 0
            male_students += st.male_students or 0
            female_students += st.female_students or 0

        # Research & Publications
        pub_count = len(r.research)
        total_publications += pub_count

        # Projects
        proj_count = len(r.projects)
        total_projects += proj_count

        # Events
        ev_count = len(r.events)
        total_events += ev_count

        # Achievements
        ach_count = len(r.achievements)
        total_achievements += ach_count

        # Placements
        if r.placement:
            pl = r.placement
            total_eligible += pl.eligible_students or 0
            total_placed += pl.placed_students or 0
            if pl.average_package and pl.average_package > 0:
                avg_packages.append(pl.average_package)
            if pl.highest_package and pl.highest_package > highest_package:
                highest_package = pl.highest_package

        departments_summary.append({
            "report_id": r.id,
            "department_id": r.department_id,
            "department_name": dept_name,
            "department_code": dept_code,
            "head_of_department": dept.head_of_department if dept else "N/A",
            "department_info": r.department_info,
            "faculty": [schemas.Faculty.model_validate(f).model_dump() for f in r.faculty],
            "student_statistics": schemas.StudentStatistic.model_validate(r.student_statistics).model_dump() if r.student_statistics else {},
            "research": [schemas.Research.model_validate(res).model_dump() for res in r.research],
            "projects": [schemas.Project.model_validate(pr).model_dump() for pr in r.projects],
            "events": [schemas.Event.model_validate(ev).model_dump() for ev in r.events],
            "achievements": [schemas.Achievement.model_validate(ac).model_dump() for ac in r.achievements],
            "placement": schemas.Placement.model_validate(r.placement).model_dump() if r.placement else {},
            "collaborations": [schemas.IndustryCollaboration.model_validate(c).model_dump() for c in r.collaborations],
            "infrastructures": [schemas.Infrastructure.model_validate(inf).model_dump() for inf in r.infrastructures],
        })

    overall_avg_package = round(sum(avg_packages) / len(avg_packages), 2) if avg_packages else 0.0
    overall_placement_rate = round((total_placed / total_eligible * 100) if total_eligible > 0 else 0, 1)

    return {
        "academic_year_id": academic_year_id,
        "academic_year_name": academic_year.name,
        "status": academic_year.status,
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

@router.get("/generate-pdf/{academic_year_id}")
def generate_pdf(
    academic_year_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request: Request = None,
):
    # Fetch aggregation data
    agg_data = get_aggregate_annual_report(academic_year_id=academic_year_id, db=db, current_user=current_user)
    
    # Generate PDF in memory using ReportLab
    pdf_buffer = generate_annual_report_pdf(
        academic_year_name=agg_data["academic_year_name"],
        aggregated_data=agg_data
    )

    filename = f"Institute_Annual_Report_{agg_data['academic_year_name']}.pdf"

    log_audit(
        db,
        action="GENERATE_PDF",
        entity="ACADEMIC_YEAR",
        entity_id=academic_year_id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Generated annual report PDF for {agg_data['academic_year_name']}",
        ip_address=request.client.host if request and request.client else None
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

@router.get("/{id}", response_model=schemas.DepartmentReport)
def get_report(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)
    return enrich_report_response(report)

@router.put("/{id}/draft", response_model=schemas.DepartmentReport)
def save_report_draft(
    id: int,
    draft_data: schemas.DepartmentReportSaveDraft,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request: Request = None,
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)

    if report.status in ["APPROVED", "SUBMITTED", "UNDER_REVIEW"] and current_user.role != "ADMIN":
        raise HTTPException(
            status_code=400,
            detail=f"Report cannot be edited while in status '{report.status}'."
        )

    # Update department_info
    if draft_data.department_info is not None:
        report.department_info = draft_data.department_info

    # Update faculty
    if draft_data.faculty is not None:
        db.query(models.Faculty).filter(models.Faculty.department_report_id == id).delete()
        for f in draft_data.faculty:
            db.add(models.Faculty(department_report_id=id, **f.model_dump()))

    # Update student_statistics
    if draft_data.student_statistics is not None:
        stat = db.query(models.StudentStatistic).filter(models.StudentStatistic.department_report_id == id).first()
        if not stat:
            stat = models.StudentStatistic(department_report_id=id, **draft_data.student_statistics.model_dump())
            db.add(stat)
        else:
            for k, v in draft_data.student_statistics.model_dump().items():
                setattr(stat, k, v)

    # Update research
    if draft_data.research is not None:
        db.query(models.Research).filter(models.Research.department_report_id == id).delete()
        for r in draft_data.research:
            db.add(models.Research(department_report_id=id, **r.model_dump()))

    # Update projects
    if draft_data.projects is not None:
        db.query(models.Project).filter(models.Project.department_report_id == id).delete()
        for p in draft_data.projects:
            db.add(models.Project(department_report_id=id, **p.model_dump()))

    # Update events
    if draft_data.events is not None:
        db.query(models.Event).filter(models.Event.department_report_id == id).delete()
        for e in draft_data.events:
            db.add(models.Event(department_report_id=id, **e.model_dump()))

    # Update achievements
    if draft_data.achievements is not None:
        db.query(models.Achievement).filter(models.Achievement.department_report_id == id).delete()
        for a in draft_data.achievements:
            db.add(models.Achievement(department_report_id=id, **a.model_dump()))

    # Update placement
    if draft_data.placement is not None:
        pl = db.query(models.Placement).filter(models.Placement.department_report_id == id).first()
        if not pl:
            pl = models.Placement(department_report_id=id, **draft_data.placement.model_dump())
            db.add(pl)
        else:
            for k, v in draft_data.placement.model_dump().items():
                setattr(pl, k, v)

    # Update collaborations
    if draft_data.collaborations is not None:
        db.query(models.IndustryCollaboration).filter(models.IndustryCollaboration.department_report_id == id).delete()
        for c in draft_data.collaborations:
            db.add(models.IndustryCollaboration(department_report_id=id, **c.model_dump()))

    # Update infrastructures
    if draft_data.infrastructures is not None:
        db.query(models.Infrastructure).filter(models.Infrastructure.department_report_id == id).delete()
        for inf in draft_data.infrastructures:
            db.add(models.Infrastructure(department_report_id=id, **inf.model_dump()))

    report.last_updated = datetime.now()
    db.commit()
    db.refresh(report)

    return enrich_report_response(report)

@router.post("/{id}/submit", response_model=schemas.DepartmentReport)
def submit_report(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
    request: Request = None,
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)

    if report.status not in ["DRAFT", "CORRECTION_REQUIRED", "REJECTED"]:
        raise HTTPException(
            status_code=400,
            detail=f"Report cannot be submitted from status '{report.status}'."
        )

    is_resubmission = report.status in ["CORRECTION_REQUIRED", "REJECTED"]
    action_type = "RESUBMITTED" if is_resubmission else "SUBMITTED"

    report.status = "SUBMITTED"
    report.submission_date = datetime.now()
    report.last_updated = datetime.now()

    # Add to submission history
    hist = models.ReportSubmissionHistory(
        department_report_id=report.id,
        action=action_type,
        actor_id=current_user.id,
        notes="Report submitted by department for institutional review"
    )
    db.add(hist)
    db.commit()
    db.refresh(report)

    # Audit log
    dept_name = report.department.name if report.department else "Department"
    log_audit(
        db,
        action=action_type,
        entity="REPORT",
        entity_id=report.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"{action_type} annual report for {dept_name}",
        ip_address=request.client.host if request and request.client else None
    )

    # Notify admins
    notify_all_admins(
        db,
        title=f"Annual Report {action_type.capitalize()}",
        message=f"{dept_name} has {action_type.lower()} their annual report for {report.academic_year.name}.",
        notif_type="INFO",
        link=f"/admin/reports?id={report.id}"
    )

    return enrich_report_response(report)

@router.post("/{id}/review", response_model=schemas.DepartmentReport)
def review_report(
    id: int,
    action_in: schemas.ReviewActionRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    allowed_statuses = ["UNDER_REVIEW", "CORRECTION_REQUIRED", "APPROVED", "REJECTED"]
    if action_in.status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid review status '{action_in.status}'. Allowed: {', '.join(allowed_statuses)}"
        )

    previous_status = report.status
    report.status = action_in.status
    report.last_updated = datetime.now()
    if action_in.admin_feedback:
        report.admin_feedback = action_in.admin_feedback

    # Add review comment if provided
    if action_in.admin_feedback:
        comment = models.ReportReviewComment(
            department_report_id=report.id,
            user_id=current_user.id,
            section_name=action_in.section_name,
            comment=action_in.admin_feedback
        )
        db.add(comment)

    # Record in history
    hist = models.ReportSubmissionHistory(
        department_report_id=report.id,
        action=action_in.status,
        actor_id=current_user.id,
        notes=action_in.admin_feedback or f"Status changed from {previous_status} to {action_in.status}"
    )
    db.add(hist)
    db.commit()
    db.refresh(report)

    # Audit log
    dept_name = report.department.name if report.department else "Department"
    log_audit(
        db,
        action=action_in.status,
        entity="REPORT",
        entity_id=report.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Reviewed report for {dept_name}: set to {action_in.status}. Notes: {action_in.admin_feedback or 'None'}",
        ip_address=request.client.host if request and request.client else None
    )

    # Notify department users
    dept_users = db.query(models.User).filter(
        models.User.department_id == report.department_id,
        models.User.is_active == True
    ).all()
    for u in dept_users:
        create_notification(
            db,
            user_id=u.id,
            title=f"Report Status: {action_in.status.replace('_', ' ').title()}",
            message=f"Your annual report was marked as {action_in.status.replace('_', ' ').title()} by Admin. Feedback: {action_in.admin_feedback or 'No remarks'}",
            notif_type="SUCCESS" if action_in.status == "APPROVED" else ("WARNING" if action_in.status == "CORRECTION_REQUIRED" else "INFO"),
            link="/department/report"
        )

    return enrich_report_response(report)

@router.post("/{id}/comment", response_model=schemas.ReportReviewComment)
def add_report_comment(
    id: int,
    comment_in: schemas.ReportReviewCommentCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)

    comment = models.ReportReviewComment(
        department_report_id=id,
        user_id=current_user.id,
        section_name=comment_in.section_name,
        comment=comment_in.comment
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    resp = schemas.ReportReviewComment.model_validate(comment)
    resp.user_name = current_user.full_name or current_user.email
    return resp

@router.post("/{id}/upload-document", response_model=schemas.SupportingDocument)
async def upload_supporting_document(
    id: int,
    file: UploadFile = File(...),
    title: str = Form(...),
    document_type: str = Form("General"),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)

    dept_folder = os.path.join(UPLOAD_DIR, "reports", str(id))
    os.makedirs(dept_folder, exist_ok=True)
    
    clean_filename = f"{int(datetime.now().timestamp())}_{file.filename}"
    file_path = os.path.join(dept_folder, clean_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size = os.path.getsize(file_path)
    file_rel_url = f"/uploads/reports/{id}/{clean_filename}"

    doc = models.SupportingDocument(
        department_report_id=id,
        title=title,
        file_url=file_rel_url,
        file_name=file.filename or clean_filename,
        file_size=file_size,
        document_type=document_type
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return doc

@router.delete("/{id}/documents/{doc_id}")
def delete_supporting_document(
    id: int,
    doc_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    report = db.query(models.DepartmentReport).filter(models.DepartmentReport.id == id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    verify_report_access(report, current_user)

    doc = db.query(models.SupportingDocument).filter(
        models.SupportingDocument.id == doc_id,
        models.SupportingDocument.department_report_id == id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(doc)
    db.commit()
    return {"message": "Document deleted successfully"}
