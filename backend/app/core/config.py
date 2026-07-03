from typing import List

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
    groq_model: str = "openai/gpt-oss-120b"
    groq_vision_model: str = "qwen/qwen3.6-27b"
    upload_dir: str = "uploads"
    # Plain string, not list[str]: pydantic-settings JSON-decodes list-typed env
    # vars *before* any field_validator runs, so a plain comma-separated
    # CORS_ORIGINS env var (the natural way to set it) would 400 at startup on
    # a list[str] field. Parse the comma-separated string ourselves instead.
    cors_origins: str = "http://localhost:5173,http://localhost:80"

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

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
