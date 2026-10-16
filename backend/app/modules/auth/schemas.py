"""Pydantic v2 schemas for authentication and user management."""

import re
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.modules.auth.enums import Role


CONTROL_CHARS_PATTERN = re.compile(r"[\x00-\x1f\x7f-\x9f]")


class UserRegisterRequest(BaseModel):
    """Esquema de registro público.
    
    extra="ignore" asegura que si el cliente envía campos privilegiados (role, is_admin, is_active),
    estos sean ignorados silenciosamente en el schema y manejados con log en el servicio.
    """
    model_config = ConfigDict(
        extra="ignore",
        json_schema_extra={
            "example": {
                "name": "Docente Carlos Perez",
                "email": "carlos.perez@campuslands.edu",
                "password": "Password123",
            }
        },
    )

    name: str = Field(..., min_length=2, max_length=100, description="Nombre completo del usuario")
    email: EmailStr = Field(..., description="Correo electrónico institucional único")
    password: str = Field(..., min_length=8, max_length=128, description="Contraseña segura")

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        clean = " ".join(value.strip().split())
        if len(clean) < 2:
            raise ValueError("El nombre debe tener al menos 2 caracteres útiles.")
        if CONTROL_CHARS_PATTERN.search(clean):
            raise ValueError("El nombre no debe contener caracteres de control.")
        return clean

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        clean = value.strip().lower()
        if "@" in clean:
            _, domain = clean.split("@", 1)
            first_seg = domain.split(".")[0]
            if any(char.isdigit() for char in first_seg):
                raise ValueError("El correo debe usar un dominio válido (.edu, .co, .com); no se permiten números en el dominio.")
        return clean

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str, info) -> str:
        if value.strip() != value:
            raise ValueError("La contraseña no debe iniciar ni terminar con espacios en blanco.")
        if len(value) < 8 or len(value) > 128:
            raise ValueError("La contraseña debe tener entre 8 y 128 caracteres.")
        if not re.search(r"[a-zA-Z]", value):
            raise ValueError("La contraseña debe contener al menos una letra.")
        if not re.search(r"\d", value):
            raise ValueError("La contraseña debe contener al menos un número.")

        # Evitar contraseñas idénticas al correo o al nombre
        data = info.data
        email = data.get("email")
        name = data.get("name")
        val_lower = value.lower()
        if email and email.lower() == val_lower:
            raise ValueError("La contraseña no puede ser idéntica a tu dirección de correo.")
        if name and name.lower() == val_lower:
            raise ValueError("La contraseña no puede ser idéntica a tu nombre.")

        return value


class UserLoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "carlos.perez@campuslands.edu",
                "password": "Password123",
            }
        }
    )

    email: EmailStr = Field(..., description="Correo del usuario")
    password: str = Field(..., description="Contraseña")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        clean = value.strip().lower()
        if "@" in clean:
            _, domain = clean.split("@", 1)
            first_seg = domain.split(".")[0]
            if any(char.isdigit() for char in first_seg):
                raise ValueError("El correo debe usar un dominio válido (.edu, .co, .com); no se permiten números en el dominio.")
        return clean


class UserPublicResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": 1,
                "name": "Docente Carlos Perez",
                "email": "carlos.perez@campuslands.edu",
                "role": "teacher",
                "is_active": True,
                "created_at": "2026-10-16T12:00:00Z",
                "updated_at": "2026-10-16T12:00:00Z",
            }
        },
    )

    id: int
    name: str
    email: str
    role: Role
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 3600,
                "user": {
                    "id": 1,
                    "name": "Docente Carlos Perez",
                    "email": "carlos.perez@campuslands.edu",
                    "role": "teacher",
                    "is_active": True,
                    "created_at": "2026-10-16T12:00:00Z",
                    "updated_at": "2026-10-16T12:00:00Z",
                },
            }
        }
    )

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserPublicResponse


class UserRoleUpdateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "role": "support"
            }
        }
    )

    role: Role = Field(..., description="Nuevo rol a asignar (admin, teacher, support)")


class UserStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "is_active": False
            }
        }
    )

    is_active: bool = Field(..., description="Nuevo estado de la cuenta (True=activa, False=desactivada)")
