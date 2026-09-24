from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class ReportTemplate(Base):
    __tablename__ = "report_templates"
    id = Column(Integer, primary_key=True, index=True)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, ARCHIVED
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    sections = relationship("ReportSection", back_populates="template", cascade="all, delete-orphan")

class ReportSection(Base):
    __tablename__ = "report_sections"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    order_index = Column(Integer, default=0)
    is_required = Column(Boolean, default=True)
    is_enabled = Column(Boolean, default=True)
    section_type = Column(String, nullable=False) # FACULTY, STUDENTS, RESEARCH, PROJECTS, EVENTS, ACHIEVEMENTS, PLACEMENTS, COLLABORATIONS, INFRASTRUCTURE, DOCUMENTS, TEXT

    template = relationship("ReportTemplate", back_populates="sections")

class DepartmentReport(Base):
    __tablename__ = "department_reports"
    id = Column(Integer, primary_key=True, index=True)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id"), nullable=False)
    status = Column(String, default="DRAFT") # DRAFT, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, CORRECTION_REQUIRED
    submission_date = Column(DateTime(timezone=True), nullable=True)
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())
    admin_feedback = Column(Text, nullable=True)
    department_info = Column(JSON, nullable=True) # { overview, vision, mission, hod_message, contact_info }

    # Relationships
    department = relationship("Department")
    academic_year = relationship("AcademicYear")
    faculty = relationship("Faculty", back_populates="report", cascade="all, delete-orphan")
    student_statistics = relationship("StudentStatistic", back_populates="report", uselist=False, cascade="all, delete-orphan")
    research = relationship("Research", back_populates="report", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="report", cascade="all, delete-orphan")
    events = relationship("Event", back_populates="report", cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="report", cascade="all, delete-orphan")
    placement = relationship("Placement", back_populates="report", uselist=False, cascade="all, delete-orphan")
    collaborations = relationship("IndustryCollaboration", back_populates="report", cascade="all, delete-orphan")
    infrastructures = relationship("Infrastructure", back_populates="report", cascade="all, delete-orphan")
    supporting_documents = relationship("SupportingDocument", back_populates="report", cascade="all, delete-orphan")
    review_comments = relationship("ReportReviewComment", back_populates="report", cascade="all, delete-orphan")
    history = relationship("ReportSubmissionHistory", back_populates="report", cascade="all, delete-orphan")

class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    name = Column(String, nullable=False)
    designation = Column(String, nullable=False)
    qualification = Column(String, nullable=True)
    specialization = Column(String, nullable=True)
    experience_years = Column(Float, default=0.0)

    report = relationship("DepartmentReport", back_populates="faculty")

class StudentStatistic(Base):
    __tablename__ = "student_statistics"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    total_students = Column(Integer, default=0)
    male_students = Column(Integer, default=0)
    female_students = Column(Integer, default=0)
    ug_students = Column(Integer, default=0)
    pg_students = Column(Integer, default=0)
    graduating_students = Column(Integer, default=0)

    report = relationship("DepartmentReport", back_populates="student_statistics")

class Research(Base):
    __tablename__ = "research"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    title = Column(String, nullable=False)
    authors = Column(String, nullable=False)
    publication_type = Column(String, default="Journal") # Journal, Conference, Book Chapter, Patent
    journal_or_conference_name = Column(String, nullable=True)
    year = Column(Integer, nullable=True)
    doi_link = Column(String, nullable=True)

    report = relationship("DepartmentReport", back_populates="research")

class Project(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    title = Column(String, nullable=False)
    project_type = Column(String, default="Capstone") # Capstone, Sponsored Research, Consultancy, Innovation
    student_names = Column(String, nullable=True)
    faculty_guide = Column(String, nullable=True)
    funding_amount = Column(Float, default=0.0)
    description = Column(Text, nullable=True)

    report = relationship("DepartmentReport", back_populates="projects")

class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    event_name = Column(String, nullable=False)
    event_type = Column(String, default="Workshop") # Workshop, Conference, Seminar, Hackathon, Guest Lecture
    event_date = Column(DateTime, nullable=True)
    venue = Column(String, nullable=True)
    organizer = Column(String, nullable=True)
    participants_count = Column(Integer, default=0)
    description = Column(Text, nullable=True)

    report = relationship("DepartmentReport", back_populates="events")

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    title = Column(String, nullable=False)
    person_or_team = Column(String, nullable=False)
    category = Column(String, default="Student") # Student, Faculty, Department
    date = Column(DateTime, nullable=True)
    level = Column(String, default="National") # Institute, State, National, International
    description = Column(Text, nullable=True)

    report = relationship("DepartmentReport", back_populates="achievements")

class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    eligible_students = Column(Integer, default=0)
    placed_students = Column(Integer, default=0)
    highest_package = Column(Float, default=0.0)
    average_package = Column(Float, default=0.0)
    lowest_package = Column(Float, default=0.0)
    companies_visited = Column(Integer, default=0)

    report = relationship("DepartmentReport", back_populates="placement")

class IndustryCollaboration(Base):
    __tablename__ = "industry_collaborations"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    company_name = Column(String, nullable=False)
    mou_signed = Column(Boolean, default=False)
    date_signed = Column(DateTime, nullable=True)
    collaborative_activities = Column(Text, nullable=True)

    report = relationship("DepartmentReport", back_populates="collaborations")

class Infrastructure(Base):
    __tablename__ = "infrastructure"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    facility_name = Column(String, nullable=False)
    lab_type = Column(String, default="Computer Lab")
    major_equipment = Column(Text, nullable=True)
    cost = Column(Float, default=0.0)
    area_sqft = Column(Float, default=0.0)

    report = relationship("DepartmentReport", back_populates="infrastructures")

class SupportingDocument(Base):
    __tablename__ = "supporting_documents"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    title = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    document_type = Column(String, default="General") # Circular, Proof, Certificate, Image, Report
    upload_date = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("DepartmentReport", back_populates="supporting_documents")

class ReportReviewComment(Base):
    __tablename__ = "report_review_comments"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    section_name = Column(String, nullable=True) # None for general comment or specific section name
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("DepartmentReport", back_populates="review_comments")
    user = relationship("User")

class ReportSubmissionHistory(Base):
    __tablename__ = "report_submission_history"
    id = Column(Integer, primary_key=True, index=True)
    department_report_id = Column(Integer, ForeignKey("department_reports.id"), nullable=False)
    action = Column(String, nullable=False) # CREATED, DRAFT_SAVED, SUBMITTED, RESUBMITTED, CORRECTION_REQUESTED, APPROVED, REJECTED
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("DepartmentReport", back_populates="history")
    actor = relationship("User")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_email = Column(String, nullable=True)
    action = Column(String, nullable=False) # LOGIN, CREATE, UPDATE, SUBMIT, APPROVE, REJECT, PUBLISH, GENERATE_PDF, etc.
    entity = Column(String, nullable=False) # USER, DEPARTMENT, REPORT, ACADEMIC_YEAR, TEMPLATE
    entity_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="INFO") # INFO, SUCCESS, WARNING, ERROR
    link = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
