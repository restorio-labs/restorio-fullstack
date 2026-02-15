import json

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Restorio API"
    PROJECT_DESCRIPTION: str = "Multi-tenant Restaurant Management Platform API"
    VERSION: str = "0.1.0"
    DEBUG: bool = False

    API_V1_PREFIX: str = "/api/v1"

    CORS_ORIGINS: list[str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            if v.startswith("["):
                return json.loads(v)
            return [origin.strip() for origin in v.split(",")]
        return v

    DATABASE_URL: str = "mongodb://localhost:27017/restorio"
    DATABASE_NAME: str = "restorio"

    POSTGRES_DSN: str = "postgresql://restorio:restorio@localhost:5432/restorio"

    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Przelewy24 (values from .env)
    PRZELEWY24_MERCHANT_ID: int = 0
    PRZELEWY24_POS_ID: int = 0

    @field_validator("PRZELEWY24_MERCHANT_ID", "PRZELEWY24_POS_ID", mode="before")
    @classmethod
    def parse_przelewy24_int(cls, v: str | int) -> int:
        if isinstance(v, int):
            return v
        try:
            return int(v)
        except (ValueError, TypeError):
            return 0

    PRZELEWY24_CRC: str = ""
    PRZELEWY24_API_KEY: str = ""
    PRZELEWY24_API_URL: str = "https://sandbox.przelewy24.pl/api/v1"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
