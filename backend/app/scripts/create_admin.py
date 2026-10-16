"""Script and utility for initial admin creation and idempotent user seeding."""

import os
import sys
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.auth.schemas import UserRegisterRequest


def ensure_user(
    name: str,
    email: str,
    password: str,
    role: Role,
    db: Session,
) -> tuple[User, bool]:
    """Crea un usuario de forma idempotente.
    
    Función reutilizable para el SEED de Mayorga. Si el usuario ya existe por correo,
    lo retorna sin modificar su contraseña ni duplicarlo. Retorna (user, was_created).
    """
    normalized_email = email.strip().lower()
    existing = db.scalar(select(User).where(User.email == normalized_email))
    if existing:
        return existing, False

    hashed = hash_password(password)
    user = User(
        name=name.strip(),
        email=normalized_email,
        password_hash=hashed,
        role=role.value,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user, True


def create_initial_admin() -> int:
    """Comando de inicialización del Administrador del Sistema.
    
    Lee credenciales desde variables de entorno y asegura idempotencia.
    """
    email = settings.ADMIN_EMAIL or os.getenv("ADMIN_EMAIL")
    password = settings.ADMIN_PASSWORD or os.getenv("ADMIN_PASSWORD")

    if not email or not password:
        print(
            "ERROR: Las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD son obligatorias.",
            file=sys.stderr,
        )
        return 1

    # Validar que cumpla con las políticas de contraseña del sistema
    try:
        UserRegisterRequest(
            name="Administrador del Campus",
            email=email,
            password=password,
        )
    except Exception as exc:
        print(f"ERROR: Las credenciales del administrador no cumplen con las políticas de seguridad: {exc}", file=sys.stderr)
        return 1

    # Asegurar que las tablas existan si no han sido creadas
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        admin_user, created = ensure_user(
            name="Administrador General",
            email=email,
            password=password,
            role=Role.ADMIN,
            db=db,
        )
        if created:
            print(f"ÉXITO: Administrador inicial creado satisfactoriamente: {admin_user.email} (ID: {admin_user.id})")
        else:
            print(f"INFO: El administrador {admin_user.email} ya existe en el sistema. Operación idempotente.")

    return 0


if __name__ == "__main__":
    sys.exit(create_initial_admin())
