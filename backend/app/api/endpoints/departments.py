from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps
from app.services.audit_service import log_audit

router = APIRouter()

@router.get("/", response_model=List[schemas.Department])
def read_departments(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    departments = db.query(models.Department).offset(skip).limit(limit).all()
    return departments

@router.get("/{id}", response_model=schemas.Department)
def read_department(
    id: int,
    db: Session = Depends(deps.get_db),
) -> Any:
    department = db.query(models.Department).filter(models.Department.id == id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.post("/", response_model=schemas.Department)
def create_department(
    *,
    db: Session = Depends(deps.get_db),
    department_in: schemas.DepartmentCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    department = db.query(models.Department).filter(
        (models.Department.name == department_in.name) | 
        (models.Department.short_code == department_in.short_code)
    ).first()
    if department:
        raise HTTPException(
            status_code=400,
            detail="Department with this name or short code already exists.",
        )
    department = models.Department(**department_in.model_dump())
    db.add(department)
    db.commit()
    db.refresh(department)

    log_audit(
        db,
        action="CREATE",
        entity="DEPARTMENT",
        entity_id=department.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Created department: {department.name} ({department.short_code})",
        ip_address=request.client.host if request and request.client else None
    )

    return department

@router.put("/{id}", response_model=schemas.Department)
def update_department(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    department_in: schemas.DepartmentUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    department = db.query(models.Department).filter(models.Department.id == id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check uniqueness if name or short_code updated
    update_data = department_in.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != department.name:
        existing = db.query(models.Department).filter(models.Department.name == update_data["name"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this name already exists")
    if "short_code" in update_data and update_data["short_code"] != department.short_code:
        existing = db.query(models.Department).filter(models.Department.short_code == update_data["short_code"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Department with this short code already exists")

    for field, value in update_data.items():
        setattr(department, field, value)

    db.commit()
    db.refresh(department)

    log_audit(
        db,
        action="UPDATE",
        entity="DEPARTMENT",
        entity_id=department.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Updated department: {department.name}",
        ip_address=request.client.host if request and request.client else None
    )

    return department

@router.delete("/{id}")
def delete_department(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    department = db.query(models.Department).filter(models.Department.id == id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Check if reports exist
    reports_count = db.query(models.DepartmentReport).filter(models.DepartmentReport.department_id == id).count()
    if reports_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete department because it has {reports_count} associated report(s). Set status to INACTIVE instead."
        )

    # Detach any assigned users
    db.query(models.User).filter(models.User.department_id == id).update({"department_id": None})
    
    dept_name = department.name
    db.delete(department)
    db.commit()

    log_audit(
        db,
        action="DELETE",
        entity="DEPARTMENT",
        entity_id=id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Deleted department: {dept_name}",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": f"Department '{dept_name}' deleted successfully"}
