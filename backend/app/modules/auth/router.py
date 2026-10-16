"""Authentication HTTP Router."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    TokenResponse,
    UserLoginRequest,
    UserPublicResponse,
    UserRegisterRequest,
)
from app.modules.auth.service import AuthService


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/register",
    response_model=UserPublicResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registro público de usuario (HU-11)",
    description="Crea una cuenta nueva con rol asignado automáticamente a 'teacher'. Los roles privilegiados son ignorados.",
)
def register(
    data: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> UserPublicResponse:
    user = AuthService.register_user(data, db)
    return UserPublicResponse.model_validate(user)


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Inicio de sesión con JWT (HU-12)",
    description="Valida credenciales con tiempo constante anti-enumeración y emite JWT firmado con expiración.",
)
def login(
    data: UserLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    return AuthService.login_user(data, db)


@router.get(
    "/me",
    response_model=UserPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Identidad del usuario autenticado (HU-12)",
    description="Devuelve la información pública del usuario autenticado a partir del token JWT activo.",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserPublicResponse:
    return UserPublicResponse.model_validate(current_user)
