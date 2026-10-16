"""Application configuration loaded from environment variables."""

import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


ALLOWED_JWT_ALGORITHMS = {"HS256", "HS384", "HS512"}


class Settings(BaseSettings):
    APP_ENV: str = "development"
    DATABASE_URL: str = "sqlite:///./campus.db"

    JWT_SECRET_KEY: str = ""
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    ADMIN_EMAIL: str | None = None
    ADMIN_PASSWORD: str | None = None

    AI_PROVIDER: str | None = None
    AI_MODEL: str | None = None
    AI_API_KEY: str | None = None
    AI_BASE_URL: str | None = None
    AI_TIMEOUT_SECONDS: float = 15.0

    CORS_ORIGINS: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("JWT_ALGORITHM")
    @classmethod
    def validate_jwt_algorithm(cls, value: str) -> str:
        if value not in ALLOWED_JWT_ALGORITHMS:
            raise ValueError(
                f"Algoritmo JWT '{value}' no permitido. Solo se permiten: {', '.join(sorted(ALLOWED_JWT_ALGORITHMS))}"
            )
        return value

    @field_validator("JWT_SECRET_KEY")
    @classmethod
    def validate_jwt_secret_key(cls, value: str, info) -> str:
        # En entorno de pruebas (testing) se permite clave corta para agilidad de tests
        env = os.getenv("APP_ENV", "development").lower()
        if env == "testing":
            return value or "testing-secret-key-at-least-32-chars-long"

        if not value or len(value.strip()) < 32:
            raise ValueError(
                "JWT_SECRET_KEY es obligatoria y debe tener al menos 32 caracteres para garantizar seguridad criptográfica."
            )
        return value


settings = Settings()
