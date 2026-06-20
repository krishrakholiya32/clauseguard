from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://clauseguard:clauseguard@postgres:5432/clauseguard"
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    upload_dir: str = "/app/uploads"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:80"]

    class Config:
        env_file = ".env"


settings = Settings()
