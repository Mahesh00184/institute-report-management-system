from typing import Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=schemas.InstituteSettings)
def get_settings(db: Session = Depends(deps.get_db)) -> Any:
    """
    Get current institute settings.
    """
    settings = db.query(models.InstituteSettings).first()
    if not settings:
        settings = models.InstituteSettings(
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
        db.refresh(settings)
    return settings

@router.put("/", response_model=schemas.InstituteSettings)
def update_settings(
    *,
    db: Session = Depends(deps.get_db),
    settings_in: schemas.InstituteSettingsUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Update institute settings. Admin only.
    """
    settings = db.query(models.InstituteSettings).first()
    if not settings:
        settings = models.InstituteSettings()
        db.add(settings)

    update_data = settings_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)

    db.commit()
    db.refresh(settings)

    log_audit(
        db,
        action="UPDATE_SETTINGS",
        entity="SETTINGS",
        entity_id=settings.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details="Admin updated institute configuration and report settings",
        ip_address=request.client.host if request and request.client else None
    )

    return settings
