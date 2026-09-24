from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InstituteSettingsBase(BaseModel):
    institute_name: str = "National Institute of Technology & Management"
    logo_url: Optional[str] = None
    address: Optional[str] = "Academic Ridge, Knowledge City, New Delhi 110001"
    email: Optional[str] = "registrar@institute.edu"
    phone: Optional[str] = "+91-11-23456789"
    website: Optional[str] = "https://institute.edu"
    default_academic_year_id: Optional[int] = None
    submission_deadline: Optional[datetime] = None
    report_naming_format: str = "AR_{YEAR}_{DEPT}"

class InstituteSettingsUpdate(BaseModel):
    institute_name: Optional[str] = None
    logo_url: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    default_academic_year_id: Optional[int] = None
    submission_deadline: Optional[datetime] = None
    report_naming_format: Optional[str] = None

class InstituteSettings(InstituteSettingsBase):
    id: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
