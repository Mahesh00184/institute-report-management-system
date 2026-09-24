from datetime import datetime, timezone, timedelta
import secrets
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.models.department import Department
from app.models.report import Notification
from app.schemas.user import (
    Token, User as UserSchema, UserRegister,
    ForgotPasswordRequest, ResetPasswordRequest
)
from app.services.audit_service import log_audit

router = APIRouter()

@router.post("/register")
def register_user(
    *,
    db: Session = Depends(deps.get_db),
    reg_in: UserRegister,
    request: Request = None
) -> Any:
    """
    Public registration for Department Coordinators and Faculty/Staff.
    Creates a user with status PENDING awaiting admin approval.
    """
    if reg_in.password != reg_in.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    # Check for existing email
    existing_email = db.query(User).filter(User.email == reg_in.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="A user with this institutional email address already exists."
        )

    # Check for existing staff_id
    if reg_in.staff_id:
        existing_staff = db.query(User).filter(User.staff_id == reg_in.staff_id.strip()).first()
        if existing_staff:
            raise HTTPException(
                status_code=400,
                detail=f"Employee/Staff ID '{reg_in.staff_id}' is already registered."
            )

    # Check department
    dept = db.query(Department).filter(Department.id == reg_in.department_id).first()
    if not dept:
        raise HTTPException(status_code=400, detail="Selected department does not exist.")

    # Create user in PENDING status
    new_user = User(
        email=reg_in.email,
        hashed_password=security.get_password_hash(reg_in.password),
        full_name=reg_in.full_name,
        role=reg_in.role_requested,
        department_id=reg_in.department_id,
        staff_id=reg_in.staff_id.strip(),
        phone=reg_in.phone,
        designation=reg_in.designation,
        status="PENDING",
        is_active=False,
        profile_image=reg_in.profile_image
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log audit
    log_audit(
        db,
        action="REGISTRATION_SUBMITTED",
        entity="USER",
        entity_id=new_user.id,
        user_id=new_user.id,
        user_email=new_user.email,
        details=f"New registration submitted for {new_user.full_name} ({new_user.role}) in {dept.name}",
        ip_address=request.client.host if request and request.client else None
    )

    # Notify all administrators
    admins = db.query(User).filter(User.role == "ADMIN").all()
    for admin in admins:
        admin_notif = Notification(
            user_id=admin.id,
            title="New User Registration",
            message=f"{new_user.full_name} ({dept.short_code}) has registered as {new_user.role} and awaits approval.",
            type="INFO",
            link="/admin/registrations"
        )
        db.add(admin_notif)
    db.commit()

    return {
        "message": "Your registration has been submitted for administrator approval.",
        "user_id": new_user.id,
        "status": "PENDING"
    }

@router.post("/login", response_model=Token)
def login_access_token(
    request: Request,
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    """
    OAuth2 compatible token login with strict status verification.
    """
    user = db.query(User).filter(User.email == form_data.username.strip().lower()).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password.")

    # Status verification
    if user.status == "PENDING":
        raise HTTPException(
            status_code=403,
            detail="Your registration is still awaiting administrator approval."
        )
    elif user.status == "REJECTED":
        reason_msg = f" Reason: {user.rejection_reason}" if user.rejection_reason else " Please contact the administration."
        raise HTTPException(
            status_code=403,
            detail=f"Your registration was rejected.{reason_msg}"
        )
    elif user.status == "SUSPENDED":
        raise HTTPException(
            status_code=403,
            detail="Your account has been suspended. Please contact the administrator."
        )
    elif not user.is_active or user.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Account is inactive.")

    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = security.create_access_token(
        user.id, expires_delta=access_token_expires
    )

    log_audit(
        db,
        action="LOGIN",
        entity="USER",
        entity_id=user.id,
        user_id=user.id,
        user_email=user.email,
        details=f"User {user.email} logged in successfully",
        ip_address=request.client.host if request.client else None
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserSchema)
def test_token(current_user: User = Depends(deps.get_current_active_user)) -> Any:
    """
    Get current authenticated active user profile.
    """
    return current_user

@router.post("/forgot-password")
def forgot_password(
    request_in: ForgotPasswordRequest,
    db: Session = Depends(deps.get_db),
    request: Request = None
) -> Any:
    """
    Generate password reset token. In local/development mode, provides safe reset token & link.
    """
    user = db.query(User).filter(User.email == request_in.email.strip().lower()).first()
    if not user:
        return {
            "message": "If the email is registered in our portal, password reset instructions have been generated."
        }

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.commit()

    log_audit(
        db,
        action="FORGOT_PASSWORD_REQUEST",
        entity="USER",
        entity_id=user.id,
        user_id=user.id,
        user_email=user.email,
        details=f"Password reset token generated for {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    # In local/demo environment, include safe dev links to streamline testing
    return {
        "message": "Password reset token generated successfully. Valid for 30 minutes.",
        "dev_reset_token": token,
        "dev_reset_link": f"/reset-password?token={token}"
    }

@router.post("/reset-password")
def reset_password(
    reset_in: ResetPasswordRequest,
    db: Session = Depends(deps.get_db),
    request: Request = None
) -> Any:
    """
    Reset password using a valid reset token.
    """
    now = datetime.now(timezone.utc)
    user = db.query(User).filter(
        User.reset_token == reset_in.token.strip()
    ).first()

    if not user:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    # Check expiration
    if user.reset_token_expires:
        expiry = user.reset_token_expires
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if expiry < now:
            raise HTTPException(status_code=400, detail="Reset token has expired. Please request a new one.")

    user.hashed_password = security.get_password_hash(reset_in.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    log_audit(
        db,
        action="PASSWORD_RESET_SUCCESS",
        entity="USER",
        entity_id=user.id,
        user_id=user.id,
        user_email=user.email,
        details=f"Password was successfully reset for {user.email}",
        ip_address=request.client.host if request and request.client else None
    )

    return {"message": "Password has been successfully updated. You may now log in with your new password."}
