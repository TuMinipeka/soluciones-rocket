"""Security utilities: Argon2 password hashing, JWT creation/verification, and signed analysis tokens."""

import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

from app.core.config import settings
from app.core.exceptions import UnauthorizedError


# Hasher Argon2id con parámetros por defecto seguros (tiempo, memoria, paralelismo)
_password_hasher = PasswordHasher()

# Hash dummy precalculado con Argon2 para verificar contraseñas cuando el usuario no existe,
# garantizando tiempo de respuesta constante y evitando ataques de enumeración de usuarios.
DUMMY_ARGON2_HASH = _password_hasher.hash("dummy_nonexistent_user_password_timing_protection")

JWT_ISSUER = "campus-control"
ANALYSIS_TOKEN_PURPOSE = "analysis"


def hash_password(password: str) -> str:
    """Genera el hash de una contraseña usando Argon2id."""
    return _password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica si la contraseña en texto claro coincide con el hash almacenado.
    
    Captura excepciones internas de verificación y devuelve False en caso de discrepancia o hash inválido.
    """
    try:
        return _password_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, InvalidHashError, VerificationError):
        return False
    except Exception:
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Indica si el hash requiere ser recalculado por actualización de parámetros de Argon2."""
    try:
        return _password_hasher.check_needs_rehash(hashed_password)
    except Exception:
        return True


def create_access_token(
    user_id: int | str,
    role: str,
    expires_delta: timedelta | None = None,
) -> tuple[str, int]:
    """Genera un JWT firmado con PyJWT para autenticación de usuario.
    
    Retorna la tupla (token_str, expires_in_seconds).
    """
    now = datetime.now(timezone.utc)
    if expires_delta is not None:
        expire = now + expires_delta
        expires_in = int(expires_delta.total_seconds())
    else:
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        expire = now + timedelta(seconds=expires_in)

    payload = {
        "sub": str(user_id),
        "role": str(role),
        "iat": now,
        "exp": expire,
        "jti": str(uuid.uuid4()),
        "iss": JWT_ISSUER,
    }

    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return token, expires_in


def decode_access_token(token: str) -> dict[str, Any]:
    """Decodifica y valida un JWT exigiendo exp, iat, sub, emisor (iss) y algoritmo exacto.
    
    Lanza UnauthorizedError con encabezado WWW-Authenticate si el token es inválido o ha expirado.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={
                "require": ["exp", "iat", "sub"],
                "verify_exp": True,
                "verify_iat": True,
                "verify_iss": True,
            },
        )
        return payload
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("El token ha expirado. Inicia sesión nuevamente.") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Token inválido o firma manipulada.") from exc
    except Exception as exc:
        raise UnauthorizedError("No se pudo autenticar el token.") from exc


def hash_description(description: str) -> str:
    """Calcula un hash SHA-256 de la descripción normalizada para vincularla al token de análisis."""
    normalized = " ".join(description.strip().lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def create_analysis_token(
    source: str,
    category: str,
    priority: str,
    responsible_team: str,
    suggests_blocking: bool,
    description: str,
    expires_minutes: int = 15,
) -> str:
    """Crea un token firmado de procedencia verificable para el análisis de incidencia.
    
    Permite demostrar criptográficamente si la clasificación provino de 'ai' o 'rules'
    y vincula el hash de la descripción para evitar reutilizaciones en reportes diferentes.
    """
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=expires_minutes)

    payload = {
        "purpose": ANALYSIS_TOKEN_PURPOSE,
        "source": source,
        "category": category,
        "priority": priority,
        "responsible_team": responsible_team,
        "suggests_blocking": suggests_blocking,
        "desc_hash": hash_description(description),
        "iat": now,
        "exp": expire,
        "iss": JWT_ISSUER,
    }

    return jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def verify_analysis_token(token: str, description: str) -> dict[str, Any] | None:
    """Verifica el token de análisis contra la descripción enviada.
    
    Devuelve los datos de clasificación si el token es legítimo, no expirado y coincide
    con la descripción analizada. Si es alterado o no coincide, retorna None.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            issuer=JWT_ISSUER,
            options={
                "require": ["exp", "iat", "purpose", "source", "desc_hash"],
                "verify_exp": True,
            },
        )
        if payload.get("purpose") != ANALYSIS_TOKEN_PURPOSE:
            return None

        # Verificar que el hash de la descripción coincida
        if payload.get("desc_hash") != hash_description(description):
            return None

        return payload
    except Exception:
        return None
