from fastapi import APIRouter
from app.api.endpoints import (
    auth,
    users,
    departments,
    academic_years,
    reports,
    dashboard,
    templates,
    public,
    notifications,
    audit_logs,
    settings,
    search
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(departments.router, prefix="/departments", tags=["departments"])
api_router.include_router(academic_years.router, prefix="/academic-years", tags=["academic years"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(templates.router, prefix="/templates", tags=["templates"])
api_router.include_router(public.router, prefix="/public", tags=["public"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
api_router.include_router(audit_logs.router, prefix="/audit-logs", tags=["audit logs"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
api_router.include_router(search.router, prefix="/search", tags=["search"])
