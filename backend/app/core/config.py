from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "Muralis API"
    PORT: int = 3000
    
    # Database
    DATABASE_URL: str = "postgresql://muralis_user:muralis_password@localhost:5432/muralis_db"
    
    # Security
    JWT_SECRET: str = "muralis_super_secret_jwt_key_2026"
    REFRESH_SECRET: str = "muralis_super_secret_refresh_key_2026"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 1
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"
    
    # S3 / MinIO Storage
    S3_BUCKET: str = "muralis-assets"
    S3_REGION: str = "us-east-1"
    S3_ENDPOINT: str = "http://localhost:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadminpassword"
    S3_FORCE_PATH_STYLE: bool = True

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
