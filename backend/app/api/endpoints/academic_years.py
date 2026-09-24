from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[schemas.AcademicYear])
def read_academic_years(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    years = db.query(models.AcademicYear).order_by(models.AcademicYear.start_date.desc()).offset(skip).limit(limit).all()
    return years

@router.get("/{id}", response_model=schemas.AcademicYear)
def read_academic_year(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    year = db.query(models.AcademicYear).filter(models.AcademicYear.id == id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic Year not found")
    return year

@router.post("/", response_model=schemas.AcademicYear)
def create_academic_year(
    *,
    db: Session = Depends(deps.get_db),
    year_in: schemas.AcademicYearCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    year = db.query(models.AcademicYear).filter(models.AcademicYear.name == year_in.name).first()
    if year:
        raise HTTPException(
            status_code=400,
            detail="Academic Year with this name already exists.",
        )
    year = models.AcademicYear(**year_in.model_dump())
    db.add(year)
    db.commit()
    db.refresh(year)

    log_audit(
        db,
        action="CREATE",
        entity="ACADEMIC_YEAR",
        entity_id=year.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Created academic year: {year.name}",
        ip_address=request.client.host if request and request.client else None
    )

    return year

@router.put("/{id}", response_model=schemas.AcademicYear)
def update_academic_year(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    year_in: schemas.AcademicYearUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    year = db.query(models.AcademicYear).filter(models.AcademicYear.id == id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic Year not found")

    update_data = year_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != year.name:
        existing = db.query(models.AcademicYear).filter(models.AcademicYear.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Academic Year with this name already exists")

    for field, value in update_data.items():
        setattr(year, field, value)

    db.commit()
    db.refresh(year)

    log_audit(
        db,
        action="UPDATE",
        entity="ACADEMIC_YEAR",
        entity_id=year.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated academic year: {year.name}, status={year.status}",
        ip_address=request.client.host if request and request.client else None
    )

    return year

@router.delete("/{id}")
def delete_academic_year(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    year = db.query(models.AcademicYear).filter(models.AcademicYear.id == id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Academic Year not found")

    reports_count = db.query(models.DepartmentReport).filter(models.DepartmentReport.academic_year_id == id).count()
    if reports_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete academic year with {reports_count} existing department report(s)."
        )

    year_name = year.name
    db.delete(year)
    db.commit()

    log_audit(
        db,
        action="DELETE",
        entity="ACADEMIC_YEAR",
        entity_id=id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted academic year: {year_name}",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": f"Academic Year '{year_name}' deleted successfully"}
