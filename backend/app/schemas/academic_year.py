from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class AcademicYearBase(BaseModel):
    name: str
    start_date: date
    end_date: date
    submission_deadline: date
    description: Optional[str] = None
    status: str = "DRAFT"

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearUpdate(AcademicYearBase):
    name: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    submission_deadline: Optional[date] = None

class AcademicYear(AcademicYearBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
