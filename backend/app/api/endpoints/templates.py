from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.audit_service import log_audit

router = APIRouter()

DEFAULT_SECTIONS = [
    {"title": "Department Information", "description": "Overview, vision, mission and HOD profile", "order_index": 1, "is_required": True, "section_type": "INFO"},
    {"title": "Faculty Details", "description": "Faculty roster, qualifications, and specializations", "order_index": 2, "is_required": True, "section_type": "FACULTY"},
    {"title": "Student Statistics", "description": "Enrollment statistics by gender and program", "order_index": 3, "is_required": True, "section_type": "STUDENTS"},
    {"title": "Research & Publications", "description": "Published journals, patents, and conference papers", "order_index": 4, "is_required": False, "section_type": "RESEARCH"},
    {"title": "Student Projects", "description": "Capstone, innovation, and sponsored projects", "order_index": 5, "is_required": False, "section_type": "PROJECTS"},
    {"title": "Events & Workshops", "description": "Conferences, seminars, and technical workshops organized", "order_index": 6, "is_required": False, "section_type": "EVENTS"},
    {"title": "Achievements & Awards", "description": "National and international honors earned", "order_index": 7, "is_required": False, "section_type": "ACHIEVEMENTS"},
    {"title": "Placements & Internships", "description": "Placement statistics and recruiting organizations", "order_index": 8, "is_required": True, "section_type": "PLACEMENTS"},
    {"title": "Industry Collaboration", "description": "MoUs and active institutional linkages", "order_index": 9, "is_required": False, "section_type": "COLLABORATIONS"},
    {"title": "Infrastructure & Labs", "description": "Laboratory facilities, specialized equipment, and computing resources", "order_index": 10, "is_required": False, "section_type": "INFRASTRUCTURE"},
    {"title": "Supporting Documents", "description": "Certificates, circulars, and verified reports", "order_index": 11, "is_required": False, "section_type": "DOCUMENTS"},
]

@router.get("/", response_model=List[schemas.ReportTemplate])
def list_templates(
    academic_year_id: Optional[int] = None,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    query = db.query(models.ReportTemplate)
    if academic_year_id:
        query = query.filter(models.ReportTemplate.academic_year_id == academic_year_id)
    templates = query.all()
    return templates

@router.get("/{id}", response_model=schemas.ReportTemplate)
def get_template(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
) -> Any:
    template = db.query(models.ReportTemplate).filter(models.ReportTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.post("/", response_model=schemas.ReportTemplate)
def create_template(
    template_in: schemas.ReportTemplateCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    template = models.ReportTemplate(
        academic_year_id=template_in.academic_year_id,
        name=template_in.name,
        status=template_in.status
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    # Initialize with default institutional sections
    for sec_data in DEFAULT_SECTIONS:
        sec = models.ReportSection(
            template_id=template.id,
            **sec_data
        )
        db.add(sec)
    db.commit()
    db.refresh(template)

    log_audit(
        db,
        action="CREATE",
        entity="TEMPLATE",
        entity_id=template.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Created report template: {template.name}",
        ip_address=request.client.host if request and request.client else None
    )

    return template

@router.put("/{id}", response_model=schemas.ReportTemplate)
def update_template(
    id: int,
    template_in: schemas.ReportTemplateUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    template = db.query(models.ReportTemplate).filter(models.ReportTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(template, field, value)

    db.commit()
    db.refresh(template)

    log_audit(
        db,
        action="UPDATE",
        entity="TEMPLATE",
        entity_id=template.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated report template: {template.name}",
        ip_address=request.client.host if request and request.client else None
    )

    return template

@router.post("/{id}/sections", response_model=schemas.ReportSection)
def add_section(
    id: int,
    section_in: schemas.ReportSectionCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    template = db.query(models.ReportTemplate).filter(models.ReportTemplate.id == id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    section = models.ReportSection(
        template_id=id,
        **section_in.model_dump()
    )
    db.add(section)
    db.commit()
    db.refresh(section)
    return section

@router.put("/sections/{section_id}", response_model=schemas.ReportSection)
def update_section(
    section_id: int,
    section_in: schemas.ReportSectionUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    section = db.query(models.ReportSection).filter(models.ReportSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Report section not found")

    for field, value in section_in.model_dump(exclude_unset=True).items():
        setattr(section, field, value)

    db.commit()
    db.refresh(section)
    return section

@router.delete("/sections/{section_id}")
def delete_section(
    section_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    section = db.query(models.ReportSection).filter(models.ReportSection.id == section_id).first()
    if not section:
        raise HTTPException(status_code=404, detail="Report section not found")

    db.delete(section)
    db.commit()
    return {"message": "Section removed from template"}
