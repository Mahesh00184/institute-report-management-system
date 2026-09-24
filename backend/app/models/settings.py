from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class InstituteSettings(Base):
    __tablename__ = "institute_settings"

    id = Column(Integer, primary_key=True, index=True)
    institute_name = Column(String, default="National Institute of Technology & Management", nullable=False)
    logo_url = Column(String, nullable=True)
    address = Column(Text, default="Academic Ridge, Knowledge City, New Delhi 110001", nullable=True)
    email = Column(String, default="contact@institute.edu", nullable=True)
    phone = Column(String, default="+91-11-23456789", nullable=True)
    website = Column(String, default="https://institute.edu", nullable=True)
    
    default_academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=True)
    submission_deadline = Column(DateTime, nullable=True)
    report_naming_format = Column(String, default="AR_{YEAR}_{DEPT}", nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
