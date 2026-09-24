from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Institute Annual Report Portal"
    DATABASE_URL: str = "sqlite:///./annual_report.db"
    JWT_SECRET_KEY: str = "supersecretkey_please_change_in_production_1234567890"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]
    UPLOAD_DIRECTORY: str = "./uploads"

    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIRECTORY, exist_ok=True)
