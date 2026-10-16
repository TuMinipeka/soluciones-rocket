"""Tests for HU-11 (Public Registration) and HU-12 (Login and JWT Authentication)."""

import time
import jwt
from argon2 import PasswordHasher
from sqlalchemy import select

from app.core.config import settings
from app.modules.auth.enums import Role
from app.modules.auth.models import User


def test_public_registration_assigns_teacher_role_only(client, db_session):
    """HU-11: El registro público siempre asigna el rol 'teacher' e ignora roles privilegiados."""
    payload = {
        "name": "Maria Rodriguez",
        "email": "maria.rodriguez@campuslands.edu",
        "password": "SecurePassword2026",
        "role": "admin",      # Intento de escalamiento
        "is_admin": True,
        "is_active": True,
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["role"] == "teacher"
    assert data["email"] == "maria.rodriguez@campuslands.edu"
    assert data["name"] == "Maria Rodriguez"
    assert data["is_active"] is True
    assert "password" not in data
    assert "password_hash" not in data

    # Comprobar directamente en la base de datos
    user_db = db_session.scalar(select(User).where(User.email == "maria.rodriguez@campuslands.edu"))
    assert user_db is not None
    assert user_db.role == "teacher"
    assert user_db.password_hash.startswith("$argon2id$")
    assert user_db.password_hash != "SecurePassword2026"


def test_public_registration_duplicate_email_conflict(client):
    """HU-11: No permite registrar dos usuarios con el mismo correo electrónico (409 Conflict)."""
    payload = {
        "name": "Docente Duplicado",
        "email": "duplicado@campuslands.edu",
        "password": "Password123",
    }
    res1 = client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    res2 = client.post("/auth/register", json=payload)
    assert res2.status_code == 409
    data = res2.json()
    assert data["error"]["code"] == "CONFLICT"
    assert "registrado" in data["error"]["message"].lower()


def test_public_registration_weak_passwords(client):
    """HU-11: Valida longitud mínima, números, letras y rechaza contraseñas idénticas al correo/nombre."""
    # Muy corta (< 8 caracteres)
    res = client.post("/auth/register", json={"name": "Carlos", "email": "carlos@campus.edu", "password": "Pass1"})
    assert res.status_code == 422

    # Sin números
    res = client.post("/auth/register", json={"name": "Carlos", "email": "carlos@campus.edu", "password": "PasswordOnly"})
    assert res.status_code == 422

    # Sin letras
    res = client.post("/auth/register", json={"name": "Carlos", "email": "carlos@campus.edu", "password": "1234567890"})
    assert res.status_code == 422

    # Idéntica al correo
    res = client.post("/auth/register", json={"name": "Carlos", "email": "carlos123@campus.edu", "password": "carlos123@campus.edu"})
    assert res.status_code == 422


def test_login_successful_and_jwt_claims(client, teacher_user):
    """HU-12: Inicio de sesión válido genera JWT firmado con claims requeridos."""
    payload = {
        "email": teacher_user.email,
        "password": "TeacherPassword123",
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] > 0
    assert data["user"]["email"] == teacher_user.email
    assert data["user"]["role"] == "teacher"

    # Verificar claims internos del JWT
    decoded = jwt.decode(
        data["access_token"],
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
        issuer="campus-control",
        options={"verify_signature": True},
    )
    assert decoded["sub"] == str(teacher_user.id)
    assert decoded["role"] == "teacher"
    assert "exp" in decoded
    assert "iat" in decoded
    assert "jti" in decoded


def test_login_generic_message_on_invalid_credentials(client, teacher_user):
    """HU-12: Mismo mensaje de error 401 si el correo no existe o si la contraseña es errónea."""
    # Contraseña incorrecta
    res1 = client.post("/auth/login", json={"email": teacher_user.email, "password": "WrongPassword999"})
    assert res1.status_code == 401
    err1 = res1.json()["error"]

    # Correo inexistente
    res2 = client.post("/auth/login", json={"email": "inexistente@campuslands.edu", "password": "WrongPassword999"})
    assert res2.status_code == 401
    err2 = res2.json()["error"]

    assert err1["message"] == err2["message"] == "Credenciales incorrectas."


def test_login_inactive_account_forbidden(client, inactive_user):
    """HU-12: Cuenta inactiva con contraseña correcta devuelve 403 Cuenta desactivada."""
    payload = {
        "email": inactive_user.email,
        "password": "InactivePassword123",
    }
    response = client.post("/auth/login", json=payload)
    assert response.status_code == 403
    data = response.json()
    assert data["error"]["code"] == "FORBIDDEN"
    assert "desactivada" in data["error"]["message"].lower()


def test_tampered_and_expired_jwt_tokens(client, teacher_user, teacher_token):
    """HU-12: Token alterado o expirado devuelve 401 con cabecera WWW-Authenticate."""
    # 1. Token manipulado
    tampered = teacher_token + "tampered"
    res = client.get("/auth/me", headers={"Authorization": f"Bearer {tampered}"})
    assert res.status_code == 401
    assert "Bearer" in res.headers.get("WWW-Authenticate", "")

    # 2. Token expirado
    expired_payload = {
        "sub": str(teacher_user.id),
        "role": teacher_user.role,
        "iat": int(time.time()) - 200,
        "exp": int(time.time()) - 100,
        "iss": "campus-control",
    }
    expired_token = jwt.encode(expired_payload, settings.JWT_SECRET_KEY, algorithm="HS256")
    res_exp = client.get("/auth/me", headers={"Authorization": f"Bearer {expired_token}"})
    assert res_exp.status_code == 401
    assert "expirado" in res_exp.json()["error"]["message"].lower()

    # 3. Token con algoritmo none
    none_payload = {"sub": str(teacher_user.id), "role": "teacher", "iat": int(time.time()), "exp": int(time.time()) + 1000, "iss": "campus-control"}
    none_token = jwt.encode(none_payload, key="", algorithm="none")
    res_none = client.get("/auth/me", headers={"Authorization": f"Bearer {none_token}"})
    assert res_none.status_code == 401


def test_get_me_endpoint_returns_identity(client, teacher_user, teacher_token):
    """HU-12: GET /auth/me devuelve la identidad autenticada."""
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == teacher_user.id
    assert data["email"] == teacher_user.email
    assert data["role"] == teacher_user.role


def test_deactivation_or_role_change_takes_immediate_effect(client, teacher_user, teacher_token, db_session):
    """HU-12: Si una cuenta es desactivada en BD, un token ya emitido queda revocado de inmediato."""
    # Verificar acceso inicial
    res1 = client.get("/auth/me", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res1.status_code == 200

    # Desactivar en BD
    teacher_user.is_active = False
    db_session.commit()

    # Petición con el mismo token previo ahora debe dar 403
    res2 = client.get("/auth/me", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res2.status_code == 403
    assert "desactivada" in res2.json()["error"]["message"].lower()
