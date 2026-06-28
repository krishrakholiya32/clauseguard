from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://clauseguard:clauseguard@postgres:5432/clauseguard"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    gemini_api_key: str = ""
    gemini_api_key_2: str = ""
    gemini_model: str = "gemini-3.1-flash-lite"
    groq_api_key: str = ""
    groq_api_key_2: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    upload_dir: str = "uploads"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:80"]

    class Config:
        env_file = ".env"

    @field_validator("database_url", mode="before")
    @classmethod
    def fix_db_url(cls, v: str) -> str:
        if v.startswith("postgres://"):
            return "postgresql+asyncpg://" + v[len("postgres://"):]
        if v.startswith("postgresql://") and "+asyncpg" not in v:
            return "postgresql+asyncpg://" + v[len("postgresql://"):]
        return v

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> Any:
        if isinstance(v, str):
            return [o.strip() for o in v.split(",") if o.strip()]
        return v


settings = Settings()
