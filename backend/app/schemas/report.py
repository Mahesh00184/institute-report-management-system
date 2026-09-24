from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime, date

# --- Faculty ---
class FacultyBase(BaseModel):
    name: str
    designation: str
    qualification: Optional[str] = None
    specialization: Optional[str] = None
    experience_years: float = 0.0

class FacultyCreate(FacultyBase):
    pass

class Faculty(FacultyBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Student Statistics ---
class StudentStatisticBase(BaseModel):
    total_students: int = 0
    male_students: int = 0
    female_students: int = 0
    ug_students: int = 0
    pg_students: int = 0
    graduating_students: int = 0

class StudentStatisticCreate(StudentStatisticBase):
    pass

class StudentStatistic(StudentStatisticBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Research & Publications ---
class ResearchBase(BaseModel):
    title: str
    authors: str
    publication_type: str = "Journal"
    journal_or_conference_name: Optional[str] = None
    year: Optional[int] = None
    doi_link: Optional[str] = None

class ResearchCreate(ResearchBase):
    pass

class Research(ResearchBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Projects ---
class ProjectBase(BaseModel):
    title: str
    project_type: str = "Capstone"
    student_names: Optional[str] = None
    faculty_guide: Optional[str] = None
    funding_amount: float = 0.0
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Events ---
class EventBase(BaseModel):
    event_name: str
    event_type: str = "Workshop"
    event_date: Optional[datetime] = None
    venue: Optional[str] = None
    organizer: Optional[str] = None
    participants_count: int = 0
    description: Optional[str] = None

class EventCreate(EventBase):
    pass

class Event(EventBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Achievements ---
class AchievementBase(BaseModel):
    title: str
    person_or_team: str
    category: str = "Student"
    date: Optional[datetime] = None
    level: str = "National"
    description: Optional[str] = None

class AchievementCreate(AchievementBase):
    pass

class Achievement(AchievementBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Placements ---
class PlacementBase(BaseModel):
    eligible_students: int = 0
    placed_students: int = 0
    highest_package: float = 0.0
    average_package: float = 0.0
    lowest_package: float = 0.0
    companies_visited: int = 0

class PlacementCreate(PlacementBase):
    pass

class Placement(PlacementBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Industry Collaborations ---
class IndustryCollaborationBase(BaseModel):
    company_name: str
    mou_signed: bool = False
    date_signed: Optional[datetime] = None
    collaborative_activities: Optional[str] = None

class IndustryCollaborationCreate(IndustryCollaborationBase):
    pass

class IndustryCollaboration(IndustryCollaborationBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Infrastructure ---
class InfrastructureBase(BaseModel):
    facility_name: str
    lab_type: str = "Computer Lab"
    major_equipment: Optional[str] = None
    cost: float = 0.0
    area_sqft: float = 0.0

class InfrastructureCreate(InfrastructureBase):
    pass

class Infrastructure(InfrastructureBase):
    id: int
    department_report_id: int
    class Config:
        from_attributes = True

# --- Supporting Documents ---
class SupportingDocumentBase(BaseModel):
    title: str
    file_url: str
    file_name: str
    file_size: int = 0
    document_type: str = "General"

class SupportingDocumentCreate(SupportingDocumentBase):
    pass

class SupportingDocument(SupportingDocumentBase):
    id: int
    department_report_id: int
    upload_date: datetime
    class Config:
        from_attributes = True

# --- Review Comments & History ---
class ReportReviewCommentBase(BaseModel):
    section_name: Optional[str] = None
    comment: str

class ReportReviewCommentCreate(ReportReviewCommentBase):
    pass

class ReportReviewComment(ReportReviewCommentBase):
    id: int
    department_report_id: int
    user_id: int
    created_at: datetime
    user_name: Optional[str] = None
    class Config:
        from_attributes = True

class ReportSubmissionHistory(BaseModel):
    id: int
    department_report_id: int
    action: str
    actor_id: int
    actor_name: Optional[str] = None
    notes: Optional[str] = None
    timestamp: datetime
    class Config:
        from_attributes = True

# --- Department Report Main ---
class DepartmentReportBase(BaseModel):
    department_id: int
    academic_year_id: int
    status: str = "DRAFT"
    admin_feedback: Optional[str] = None
    department_info: Optional[Dict[str, Any]] = None

class DepartmentReportCreate(BaseModel):
    department_id: int
    academic_year_id: int

class DepartmentReportSaveDraft(BaseModel):
    department_info: Optional[Dict[str, Any]] = None
    faculty: Optional[List[FacultyCreate]] = None
    student_statistics: Optional[StudentStatisticCreate] = None
    research: Optional[List[ResearchCreate]] = None
    projects: Optional[List[ProjectCreate]] = None
    events: Optional[List[EventCreate]] = None
    achievements: Optional[List[AchievementCreate]] = None
    placement: Optional[PlacementCreate] = None
    collaborations: Optional[List[IndustryCollaborationCreate]] = None
    infrastructures: Optional[List[InfrastructureCreate]] = None

class DepartmentReport(DepartmentReportBase):
    id: int
    submission_date: Optional[datetime] = None
    last_updated: Optional[datetime] = None
    department_name: Optional[str] = None
    department_code: Optional[str] = None
    academic_year_name: Optional[str] = None
    
    faculty: List[Faculty] = []
    student_statistics: Optional[StudentStatistic] = None
    research: List[Research] = []
    projects: List[Project] = []
    events: List[Event] = []
    achievements: List[Achievement] = []
    placement: Optional[Placement] = None
    collaborations: List[IndustryCollaboration] = []
    infrastructures: List[Infrastructure] = []
    supporting_documents: List[SupportingDocument] = []
    review_comments: List[ReportReviewComment] = []
    history: List[ReportSubmissionHistory] = []

    class Config:
        from_attributes = True

class ReviewActionRequest(BaseModel):
    status: str # UNDER_REVIEW, CORRECTION_REQUIRED, APPROVED, REJECTED
    admin_feedback: Optional[str] = None
    section_name: Optional[str] = None

# --- Report Templates & Sections ---
class ReportSectionBase(BaseModel):
    title: str
    description: Optional[str] = None
    order_index: int = 0
    is_required: bool = True
    is_enabled: bool = True
    section_type: str

class ReportSectionCreate(ReportSectionBase):
    pass

class ReportSectionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    order_index: Optional[int] = None
    is_required: Optional[bool] = None
    is_enabled: Optional[bool] = None
    section_type: Optional[str] = None

class ReportSection(ReportSectionBase):
    id: int
    template_id: int
    class Config:
        from_attributes = True

class ReportTemplateBase(BaseModel):
    academic_year_id: int
    name: str
    status: str = "ACTIVE"

class ReportTemplateCreate(ReportTemplateBase):
    pass

class ReportTemplateUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None

class ReportTemplate(ReportTemplateBase):
    id: int
    created_at: datetime
    sections: List[ReportSection] = []
    class Config:
        from_attributes = True

# --- Notifications & Audit Logs ---
class NotificationBase(BaseModel):
    title: str
    message: str
    type: str = "INFO"
    link: Optional[str] = None
    is_read: bool = False

class Notification(NotificationBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class AuditLogBase(BaseModel):
    user_id: Optional[int] = None
    user_email: Optional[str] = None
    action: str
    entity: str
    entity_id: Optional[int] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None

class AuditLog(AuditLogBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True
