import os
import shutil
import uuid
from typing import Any, Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app import models, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.services.audit_service import log_audit

router = APIRouter()

# -------------------------------------------------------------
# User Profile Endpoints (Self-Management)
# -------------------------------------------------------------

@router.get("/profile/me", response_model=schemas.User)
def get_my_profile(
    current_user: models.User = Depends(deps.get_current_active_user)
) -> Any:
    """
    Get profile information of the currently logged-in user.
    """
    return current_user

@router.put("/profile/me", response_model=schemas.User)
def update_my_profile(
    *,
    db: Session = Depends(deps.get_db),
    profile_in: schemas.ProfileUpdate,
    current_user: models.User = Depends(deps.get_current_active_user),
    request: Request = None
) -> Any:
    """
    Update allowed profile fields for current user.
    Role and account status cannot be altered here.
    """
    if profile_in.full_name is not None and len(profile_in.full_name.strip()) > 0:
        current_user.full_name = profile_in.full_name.strip()

    if profile_in.phone is not None:
        current_user.phone = profile_in.phone.strip()

    if profile_in.designation is not None:
        current_user.designation = profile_in.designation.strip()

    if profile_in.profile_image is not None:
        current_user.profile_image = profile_in.profile_image

    if profile_in.staff_id is not None and profile_in.staff_id.strip() != current_user.staff_id:
        existing = db.query(models.User).filter(
            models.User.staff_id == profile_in.staff_id.strip(),
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Staff ID is already in use by another account.")
        current_user.staff_id = profile_in.staff_id.strip()

    db.commit()
    db.refresh(current_user)

    log_audit(
        db,
        action="PROFILE_UPDATED",
        entity="USER",
        entity_id=current_user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"User {current_user.email} updated profile information",
        ip_address=request.client.host if request and request.client else None
    )

    return current_user

@router.post("/profile/change-password")
def change_my_password(
    *,
    db: Session = Depends(deps.get_db),
    pwd_in: schemas.PasswordChange,
    current_user: models.User = Depends(deps.get_current_active_user),
    request: Request = None
) -> Any:
    """
    Change current user's password after validating existing password.
    """
    if not security.verify_password(pwd_in.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect.")

    current_user.hashed_password = security.get_password_hash(pwd_in.new_password)
    db.commit()

    log_audit(
        db,
        action="PASSWORD_CHANGED",
        entity="USER",
        entity_id=current_user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"User {current_user.email} changed password",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": "Password changed successfully."}

@router.post("/profile/avatar")
def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(deps.get_current_active_user),
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Upload user profile avatar.
    """
    avatar_dir = os.path.join(settings.UPLOAD_DIRECTORY, "avatars")
    os.makedirs(avatar_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    safe_filename = f"avatar_{current_user.id}_{uuid.uuid4().hex[:8]}.{ext}"
    dest_path = os.path.join(avatar_dir, safe_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    avatar_url = f"/uploads/avatars/{safe_filename}"
    current_user.profile_image = avatar_url
    db.commit()
    db.refresh(current_user)

    return {"profile_image": avatar_url}


# -------------------------------------------------------------
# Admin Registration Queue Endpoints
# -------------------------------------------------------------

@router.get("/registrations")
def get_registrations(
    db: Session = Depends(deps.get_db),
    status: Optional[str] = None,
    q: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: models.User = Depends(deps.get_current_active_admin)
) -> Any:
    """
    Get user registrations with filtering. Admin only.
    """
    query = db.query(models.User)

    if status and status.upper() != "ALL":
        query = query.filter(models.User.status == status.upper())

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.User.full_name.ilike(search_pattern),
                models.User.email.ilike(search_pattern),
                models.User.staff_id.ilike(search_pattern),
                models.User.designation.ilike(search_pattern)
            )
        )

    total = query.count()
    registrations = query.order_by(desc(models.User.created_at)).offset(skip).limit(limit).all()

    # Also count pending registrations specifically for badge counter
    pending_count = db.query(models.User).filter(models.User.status == "PENDING").count()

    return {
        "total": total,
        "pending_count": pending_count,
        "registrations": [schemas.User.model_validate(u) for u in registrations]
    }

@router.post("/{id}/approve", response_model=schemas.User)
def approve_registration(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Approve user registration. Sets status to ACTIVE, enables login, and creates in-app notification.
    """
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "ACTIVE"
    user.is_active = True
    user.rejection_reason = None
    db.commit()
    db.refresh(user)

    # In-app notification for the approved user
    notif = models.Notification(
        user_id=user.id,
        title="Registration Approved",
        message=f"Welcome! Your registration has been approved. You now have full access as {user.role}.",
        type="SUCCESS",
        link="/department/dashboard" if user.role == "DEPARTMENT" else "/"
    )
    db.add(notif)
    db.commit()

    log_audit(
        db,
        action="REGISTRATION_APPROVED",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin {current_user.email} approved user {user.email} ({user.role})",
        ip_address=request.client.host if request and request.client else None
    )

    return user

@router.post("/{id}/reject", response_model=schemas.User)
def reject_registration(
    id: int,
    reject_in: schemas.RejectRegistrationRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Reject user registration with reason.
    """
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "REJECTED"
    user.is_active = False
    user.rejection_reason = reject_in.reason.strip()
    db.commit()
    db.refresh(user)

    # In-app notification for user
    notif = models.Notification(
        user_id=user.id,
        title="Registration Status Update",
        message=f"Your registration was rejected. Reason: {reject_in.reason.strip()}",
        type="ERROR",
        link=None
    )
    db.add(notif)
    db.commit()

    log_audit(
        db,
        action="REGISTRATION_REJECTED",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin {current_user.email} rejected user {user.email}. Reason: {reject_in.reason}",
        ip_address=request.client.host if request and request.client else None
    )

    return user

@router.post("/{id}/suspend", response_model=schemas.User)
def suspend_user(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Suspend user account.
    """
    if current_user.id == id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own account.")

    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "SUSPENDED"
    user.is_active = False
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        action="ACCOUNT_SUSPENDED",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin {current_user.email} suspended user {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    return user

@router.post("/{id}/activate", response_model=schemas.User)
def activate_user(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Reactivate user account.
    """
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "ACTIVE"
    user.is_active = True
    db.commit()
    db.refresh(user)

    log_audit(
        db,
        action="ACCOUNT_ACTIVATED",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin {current_user.email} activated user {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    return user

@router.post("/{id}/reset-password")
def admin_reset_password(
    id: int,
    new_password: str = Query(..., min_length=6),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None
) -> Any:
    """
    Admin resets password for any user account.
    """
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = security.get_password_hash(new_password)
    db.commit()

    log_audit(
        db,
        action="ADMIN_PASSWORD_RESET",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin reset password for user {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": f"Password for {user.email} has been reset successfully."}


# -------------------------------------------------------------
# Admin User Management CRUD
# -------------------------------------------------------------

@router.get("/")
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
    q: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    department_id: Optional[int] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Retrieve users with search, department/role/status filters, sorting and pagination.
    """
    query = db.query(models.User)

    if q:
        search_pattern = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.User.full_name.ilike(search_pattern),
                models.User.email.ilike(search_pattern),
                models.User.staff_id.ilike(search_pattern),
                models.User.designation.ilike(search_pattern)
            )
        )

    if role and role != "ALL":
        query = query.filter(models.User.role == role)

    if status and status != "ALL":
        query = query.filter(models.User.status == status)

    if department_id:
        query = query.filter(models.User.department_id == department_id)

    # Sorting
    sort_column = getattr(models.User, sort_by, models.User.created_at)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    total = query.count()
    users = query.offset(skip).limit(limit).all()

    page = (skip // limit) + 1 if limit > 0 else 1
    pages = (total + limit - 1) // limit if limit > 0 else 1

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages,
        "users": [schemas.User.model_validate(u) for u in users]
    }

@router.get("/{id}", response_model=schemas.User)
def read_user(
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("/", response_model=schemas.User)
def create_user(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    user = db.query(models.User).filter(models.User.email == user_in.email.strip().lower()).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system.",
        )
    if user_in.department_id:
        dept = db.query(models.Department).filter(models.Department.id == user_in.department_id).first()
        if not dept:
            raise HTTPException(status_code=400, detail="Specified department does not exist")

    if user_in.staff_id:
        existing_staff = db.query(models.User).filter(models.User.staff_id == user_in.staff_id.strip()).first()
        if existing_staff:
            raise HTTPException(status_code=400, detail=f"Staff ID '{user_in.staff_id}' is already assigned.")

    new_user = models.User(
        email=user_in.email.strip().lower(),
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role=user_in.role,
        department_id=user_in.department_id,
        staff_id=user_in.staff_id.strip() if user_in.staff_id else None,
        phone=user_in.phone,
        designation=user_in.designation,
        status=user_in.status or "ACTIVE",
        is_active=user_in.is_active,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit(
        db,
        action="CREATE",
        entity="USER",
        entity_id=new_user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin created user: {new_user.email} with role {new_user.role}",
        ip_address=request.client.host if request and request.client else None
    )

    return new_user

@router.put("/{id}", response_model=schemas.User)
def update_user(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_in.model_dump(exclude_unset=True)
    
    if "email" in update_data and update_data["email"]:
        new_email = update_data["email"].strip().lower()
        if new_email != user.email:
            existing = db.query(models.User).filter(models.User.email == new_email).first()
            if existing:
                raise HTTPException(status_code=400, detail="User with this email already exists")
            user.email = new_email

    if "staff_id" in update_data and update_data["staff_id"]:
        new_staff = update_data["staff_id"].strip()
        if new_staff != user.staff_id:
            existing_staff = db.query(models.User).filter(models.User.staff_id == new_staff).first()
            if existing_staff:
                raise HTTPException(status_code=400, detail="Staff ID is already assigned to another user.")
            user.staff_id = new_staff

    if "department_id" in update_data:
        if update_data["department_id"] is not None:
            dept = db.query(models.Department).filter(models.Department.id == update_data["department_id"]).first()
            if not dept:
                raise HTTPException(status_code=400, detail="Specified department does not exist")
        user.department_id = update_data["department_id"]

    for field in ["full_name", "role", "is_active", "phone", "designation", "status", "profile_image"]:
        if field in update_data and update_data[field] is not None:
            setattr(user, field, update_data[field])

    if "password" in update_data and update_data["password"]:
        user.hashed_password = security.get_password_hash(update_data["password"])

    db.commit()
    db.refresh(user)

    log_audit(
        db,
        action="UPDATE",
        entity="USER",
        entity_id=user.id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin updated user: {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    return user

@router.delete("/{id}")
def delete_user(
    *,
    id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    request: Request = None,
) -> Any:
    if current_user.id == id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.email
    db.delete(user)
    db.commit()

    log_audit(
        db,
        action="DELETE",
        entity="USER",
        entity_id=id,
        user_id=current_user.id,
        user_email=current_user.email,
        details=f"Admin deleted user: {email}",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": f"User '{email}' deleted successfully"}
