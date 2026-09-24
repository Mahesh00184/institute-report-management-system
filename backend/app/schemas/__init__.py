from app.schemas.user import (
    User, UserCreate, UserUpdate, UserRegister, ProfileUpdate, PasswordChange,
    ForgotPasswordRequest, ResetPasswordRequest, RejectRegistrationRequest,
    UserListResponse, Token, TokenPayload, DepartmentBrief
)
from app.schemas.department import Department, DepartmentCreate, DepartmentUpdate
from app.schemas.academic_year import AcademicYear, AcademicYearCreate, AcademicYearUpdate
from app.schemas.settings import InstituteSettings, InstituteSettingsBase, InstituteSettingsUpdate
from app.schemas.report import (
    Faculty, FacultyCreate,
    StudentStatistic, StudentStatisticCreate,
    Research, ResearchCreate,
    Project, ProjectCreate,
    Event, EventCreate,
    Achievement, AchievementCreate,
    Placement, PlacementCreate,
    IndustryCollaboration, IndustryCollaborationCreate,
    Infrastructure, InfrastructureCreate,
    SupportingDocument, SupportingDocumentCreate,
    ReportReviewComment, ReportReviewCommentCreate,
    ReportSubmissionHistory,
    DepartmentReport, DepartmentReportCreate, DepartmentReportSaveDraft,
    ReviewActionRequest,
    ReportSection, ReportSectionCreate, ReportSectionUpdate,
    ReportTemplate, ReportTemplateCreate, ReportTemplateUpdate,
    Notification, NotificationBase,
    AuditLog, AuditLogBase
)
