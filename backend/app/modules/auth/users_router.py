"""User Management HTTP Router (Admin Only)."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    UserPublicResponse,
    UserRoleUpdateRequest,
    UserStatusUpdateRequest,
)
from app.modules.auth.service import AuthService


router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "",
    response_model=list[UserPublicResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar usuarios del sistema (HU-13)",
    description="Permite al administrador consultar usuarios con paginación y filtros opcionales por rol y estado.",
)
def list_users(
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    role: Role | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> list[UserPublicResponse]:
    users = AuthService.list_users(limit, offset, role, is_active, db)
    return [UserPublicResponse.model_validate(u) for u in users]


@router.patch(
    "/{id}/role",
    response_model=UserPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Modificar rol de un usuario (HU-13)",
    description="Permite al administrador asignar un nuevo rol a un usuario existente. Impide cambiar el propio rol o degradar al último admin.",
)
def update_user_role(
    id: int,
    data: UserRoleUpdateRequest,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> UserPublicResponse:
    updated = AuthService.update_user_role(id, data.role, current_admin, db)
    return UserPublicResponse.model_validate(updated)


@router.patch(
    "/{id}/status",
    response_model=UserPublicResponse,
    status_code=status.HTTP_200_OK,
    summary="Modificar estado de una cuenta (HU-13)",
    description="Permite al administrador activar o desactivar un usuario. Impide desactivar la propia cuenta o al último admin.",
)
def update_user_status(
    id: int,
    data: UserStatusUpdateRequest,
    current_admin: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> UserPublicResponse:
    updated = AuthService.update_user_status(id, data.is_active, current_admin, db)
    return UserPublicResponse.model_validate(updated)
