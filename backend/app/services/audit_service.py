from sqlalchemy.orm import Session
from typing import Optional
from app import models

def log_audit(
    db: Session,
    action: str,
    entity: str,
    entity_id: Optional[int] = None,
    user_id: Optional[int] = None,
    user_email: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    audit_entry = models.AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=details,
        ip_address=ip_address
    )
    db.add(audit_entry)
    db.commit()

def create_notification(
    db: Session,
    user_id: int,
    title: str,
    message: str,
    notif_type: str = "INFO",
    link: Optional[str] = None
):
    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        link=link
    )
    db.add(notif)
    db.commit()

def notify_all_admins(
    db: Session,
    title: str,
    message: str,
    notif_type: str = "INFO",
    link: Optional[str] = None
):
    admins = db.query(models.User).filter(models.User.role == "ADMIN", models.User.is_active == True).all()
    for admin in admins:
        notif = models.Notification(
            user_id=admin.id,
            title=title,
            message=message,
            type=notif_type,
            link=link
        )
        db.add(notif)
    db.commit()
