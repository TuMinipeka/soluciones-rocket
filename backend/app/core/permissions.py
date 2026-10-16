"""Centralized role-based access control and FastAPI permission dependencies."""

from collections.abc import Callable
from typing import Any
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_access_token
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User


# HTTPBearer con auto_error=False para personalizar el formato JSON de error según el estándar del proyecto
http_bearer = HTTPBearer(auto_error=False)


# Diccionario central de permisos por rol. Modificable en caliente en < 1 minuto.
ROLE_PERMISSIONS: dict[str, set[str]] = {
    Role.ADMIN.value: {
        "reserve_space",
        "manage_users",
        "confirm_relocation",
        "report_incident",
        "manage_incidents",
        "view_all_incidents",
        "reopen_incident",
    },
    Role.TEACHER.value: {
        "reserve_space",
        "report_incident",
    },
    Role.SUPPORT.value: {
        "report_incident",
        "manage_incidents",
        "view_all_incidents",
    },
}


def can_reserve(role: str) -> bool:
    """Verifica si el rol puede reservar espacios (Admin y Docente: Sí; Soporte: No)."""
    return "reserve_space" in ROLE_PERMISSIONS.get(role, set())


def can_manage_users(role: str) -> bool:
    """Solo el administrador puede listar usuarios y cambiar roles o estados."""
    return "manage_users" in ROLE_PERMISSIONS.get(role, set())


def can_confirm_relocation(role: str) -> bool:
    """Solo el administrador puede confirmar reubicaciones operativas."""
    return "confirm_relocation" in ROLE_PERMISSIONS.get(role, set())


def can_report_incident(role: str) -> bool:
    """Cualquier usuario autenticado y activo puede registrar incidencias."""
    return "report_incident" in ROLE_PERMISSIONS.get(role, set())


def can_manage_incidents(role: str) -> bool:
    """Soporte y Administrador pueden gestionar, cambiar estado y resolver incidencias."""
    return "manage_incidents" in ROLE_PERMISSIONS.get(role, set())


def can_view_all_incidents(role: str) -> bool:
    """Soporte y Administrador ven todas las incidencias; Docente solo ve las propias."""
    return "view_all_incidents" in ROLE_PERMISSIONS.get(role, set())


def can_reopen_incident(role: str) -> bool:
    """Solo el administrador puede reabrir una incidencia ya resuelta."""
    return "reopen_incident" in ROLE_PERMISSIONS.get(role, set())


def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(http_bearer),
    db: Session = Depends(get_db),
) -> User:
    """Dependencia FastAPI que obtiene y valida el usuario activo a partir del JWT.
    
    CRÍTICO: No confía ciegamente en el rol del JWT; recarga al usuario desde la base
    de datos para garantizar que cualquier cambio de rol o desactivación surta efecto
    inmediato en peticiones subsecuentes.
    """
    if auth is None or not auth.credentials:
        raise UnauthorizedError("Se requiere token de autenticación Bearer.")

    payload = decode_access_token(auth.credentials)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedError("Token no contiene identificación de usuario válida.")

    try:
        user_id = int(user_id_str)
    except ValueError as exc:
        raise UnauthorizedError("Identificador de usuario inválido en token.") from exc

    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise UnauthorizedError("El usuario asociado al token no existe.")

    if not user.is_active:
        raise ForbiddenError("Cuenta desactivada. Contacta al administrador.")

    return user


def require_roles(*allowed_roles: Role | str):
    """Fábrica de dependencias que restringe el acceso a los roles especificados.
    
    Ejemplo de uso para reservas (Conde) o inventario (Mayorga):
    >>> @router.post("/reservations")
    >>> def create_reservation(user: User = Depends(require_roles(Role.ADMIN, Role.TEACHER))):
    >>>     return {"message": "Permitido"}
    """
    roles_set = {r.value if isinstance(r, Role) else str(r) for r in allowed_roles}

    def _role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles_set:
            raise ForbiddenError(
                f"Acceso denegado: se requiere uno de los siguientes roles: {', '.join(sorted(roles_set))}."
            )
        return user

    return _role_checker


def require_permission(permission_check: Callable[[str], bool]):
    """Fábrica de dependencias basada en función evaluadora de permisos.
    
    Ejemplo de uso para reubicación inteligente:
    >>> @router.post("/spaces/relocate")
    >>> def confirm_relocation(user: User = Depends(require_permission(can_confirm_relocation))):
    >>>     return {"message": "Reubicación autorizada"}
    """
    def _perm_checker(user: User = Depends(get_current_user)) -> User:
        if not permission_check(user.role):
            raise ForbiddenError("No tienes autorización suficiente para ejecutar esta operación.")
        return user

    return _perm_checker
