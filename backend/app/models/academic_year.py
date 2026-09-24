from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from app.db.base import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False) # e.g. "2025-2026"
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    submission_deadline = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    status = Column(String, default="DRAFT") # DRAFT, OPEN, SUBMISSION_CLOSED, UNDER_COMPILATION, PUBLISHED, ARCHIVED
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
