from typing import Any, List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.api import deps

router = APIRouter()

@router.get("/", response_model=List[schemas.AuditLog])
def list_audit_logs(
    db: Session = Depends(deps.get_db),
    action: Optional[str] = None,
    entity: Optional[str] = None,
    user_email: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    query = db.query(models.AuditLog)
    if action:
        query = query.filter(models.AuditLog.action == action)
    if entity:
        query = query.filter(models.AuditLog.entity == entity)
    if user_email:
        query = query.filter(models.AuditLog.user_email.ilike(f"%{user_email}%"))

    logs = query.order_by(models.AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs
