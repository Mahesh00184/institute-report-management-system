from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime

class DepartmentBrief(BaseModel):
    id: int
    name: str
    short_code: str

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "DEPARTMENT"
    department_id: Optional[int] = None
    staff_id: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    status: str = "ACTIVE"
    profile_image: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    staff_id: str = Field(..., min_length=2)
    phone: Optional[str] = None
    department_id: int
    designation: str = Field(..., min_length=2)
    role_requested: str = Field("DEPARTMENT")  # "DEPARTMENT" or "FACULTY"
    profile_image: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_institutional_email(cls, v: str) -> str:
        v = v.strip().lower()
        # Institutional email check: Must not be common free consumer email
        consumer_domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "icloud.com"]
        domain = v.split("@")[-1] if "@" in v else ""
        if domain in consumer_domains:
            raise ValueError("Please provide a valid institutional email address (e.g., @institute.edu, @college.ac.in).")
        return v

    @field_validator("role_requested")
    @classmethod
    def validate_role(cls, v: str) -> str:
        role = v.strip().upper()
        if role not in ["DEPARTMENT", "FACULTY", "STAFF"]:
            raise ValueError("Role requested must be 'DEPARTMENT' (Coordinator) or 'FACULTY' / 'STAFF'. Admin registration is not allowed.")
        return role

class UserUpdate(BaseModel):
    password: Optional[str] = None
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    department_id: Optional[int] = None
    staff_id: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    profile_image: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    designation: Optional[str] = None
    staff_id: Optional[str] = None
    profile_image: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

class RejectRegistrationRequest(BaseModel):
    reason: str = Field(..., min_length=3)

class User(UserBase):
    id: int
    rejection_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_login: Optional[datetime] = None
    department: Optional[DepartmentBrief] = None

    class Config:
        from_attributes = True

class UserListResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    users: list[User]

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[User] = None

class TokenPayload(BaseModel):
    sub: Optional[int] = None
