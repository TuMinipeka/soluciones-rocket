"""Idempotent authorized room and demo-account seed; no bookings or equipment."""

import os
import sys

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.auth.schemas import UserRegisterRequest
from app.modules.spaces.models import Space
from app.scripts.create_admin import ensure_user
from app.scripts.init_db import init_db
from app.services.availability import OFFICIAL_SPACES


def _demo_accounts_from_env() -> list[tuple[str, str, str, Role]]:
    accounts = []
    for label, role, name in (
        ("ADMIN", Role.ADMIN, "Administrador de demostración"),
        ("TEACHER", Role.TEACHER, "Docente de demostración"),
        ("SUPPORT", Role.SUPPORT, "Soporte de demostración"),
    ):
        email = os.getenv(f"{label}_EMAIL", "")
        password = os.getenv(f"{label}_PASSWORD", "")
        if not email or not password:
            raise ValueError(f"Faltan {label}_EMAIL y {label}_PASSWORD para el SEED.")
        validated = UserRegisterRequest(name=name, email=email, password=password)
        accounts.append((name, str(validated.email), validated.password, role))
    if len({email for _, email, _, _ in accounts}) != len(accounts):
        raise ValueError("Cada cuenta demo requiere un correo diferente.")
    return accounts


def seed_demo(db: Session, accounts: list[tuple[str, str, str, Role]]) -> dict[str, int]:
    """Insert only missing official rooms and accounts in one transaction."""
    created_rooms = 0
    created_users = 0
    try:
        for sid, official in OFFICIAL_SPACES.items():
            room = db.get(Space, sid)
            if room is None:
                db.add(Space(id=sid, name=official["name"], capacity=official["capacity"]))
                created_rooms += 1
            elif (room.name, room.capacity) != (official["name"], official["capacity"]):
                raise ValueError(f"La sala {sid} difiere del catálogo autorizado; no se sobrescribió.")

        for name, email, password, role in accounts:
            existing = db.scalar(select(User).where(User.email == email))
            if existing is not None and existing.role != role.value:
                raise ValueError(f"La cuenta {email} ya existe con otro rol; no se sobrescribió.")
            _, created = ensure_user(name, email, password, role, db, commit=False)
            created_users += int(created)

        db.commit()
    except Exception:
        db.rollback()
        raise
    return {"rooms_created": created_rooms, "users_created": created_users}


def main() -> int:
    try:
        accounts = _demo_accounts_from_env()
        init_db()
        with SessionLocal() as db:
            result = seed_demo(db, accounts)
    except Exception as exc:
        print(f"SEED falló: {exc}", file=sys.stderr)
        return 1
    print(f"SEED listo: {result['rooms_created']} salas y {result['users_created']} cuentas creadas.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
