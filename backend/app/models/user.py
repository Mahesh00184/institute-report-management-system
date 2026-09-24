from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=False)
    role = Column(String, default="DEPARTMENT")  # 'ADMIN', 'DEPARTMENT', 'FACULTY'
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, index=True)
    staff_id = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    status = Column(String, default="PENDING", index=True)  # 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'
    rejection_reason = Column(Text, nullable=True)
    profile_image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    last_login = Column(DateTime(timezone=True), nullable=True)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    department = relationship("Department")
