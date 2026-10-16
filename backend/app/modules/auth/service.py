"""Authentication and user management business logic."""

from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.core.security import (
    DUMMY_ARGON2_HASH,
    create_access_token,
    hash_password,
    needs_rehash,
    verify_password,
)
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.auth.schemas import (
    TokenResponse,
    UserLoginRequest,
    UserPublicResponse,
    UserRegisterRequest,
)


class AuthService:
    @staticmethod
    def register_user(data: UserRegisterRequest, db: Session) -> User:
        """Registra un nuevo usuario público asignando SIEMPRE el rol 'teacher'.
        
        Cualquier intento del cliente de especificar roles privilegiados u otros campos
        es ignorado de manera segura en el servidor.
        """
        normalized_email = data.email.strip().lower()

        # Verificar si el correo ya existe
        existing = db.scalar(select(User).where(User.email == normalized_email))
        if existing:
            raise ConflictError("El correo electrónico ya se encuentra registrado.")

        hashed = hash_password(data.password)

        # Manejo de rol institucional: permite teacher o support.
        # Seguridad anti-escalamiento: intentos de registrarse como admin se asignan a teacher.
        req_role = getattr(data, "role", None)
        raw_role = req_role.value if hasattr(req_role, "value") else str(req_role or "teacher").strip().lower()
        if raw_role == "support":
            assigned_role = Role.SUPPORT.value
        else:
            assigned_role = Role.TEACHER.value

        new_user = User(
            name=data.name,
            email=normalized_email,
            password_hash=hashed,
            role=assigned_role,
            is_active=True,
        )

        try:
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            return new_user
        except IntegrityError as exc:
            db.rollback()
            raise ConflictError("El correo electrónico ya se encuentra registrado.") from exc

    @staticmethod
    def login_user(data: UserLoginRequest, db: Session) -> TokenResponse:
        """Autentica a un usuario protegiendo contra ataques de temporización y enumeración."""
        normalized_email = data.email.strip().lower()
        user = db.scalar(select(User).where(User.email == normalized_email))

        if user is None:
            # Comparar contra hash dummy para igualar los tiempos de CPU de verificación
            verify_password(data.password, DUMMY_ARGON2_HASH)
            raise UnauthorizedError("Credenciales incorrectas.")

        is_valid = verify_password(data.password, user.password_hash)
        if not is_valid:
            raise UnauthorizedError("Credenciales incorrectas.")

        # Verificar estado de la cuenta solo tras haber validado la contraseña con éxito
        if not user.is_active:
            raise ForbiddenError("Cuenta desactivada. Contacta al administrador.")

        # Si el algoritmo de hash requiere actualización de parámetros, recalcular y guardar
        if needs_rehash(user.password_hash):
            user.password_hash = hash_password(data.password)
            db.commit()

        token, expires_in = create_access_token(user_id=user.id, role=user.role)
        return TokenResponse(
            access_token=token,
            token_type="bearer",
            expires_in=expires_in,
            user=UserPublicResponse.model_validate(user),
        )

    @staticmethod
    def list_users(
        limit: int,
        offset: int,
        role: Role | None,
        is_active: bool | None,
        db: Session,
    ) -> list[User]:
        query = select(User).order_by(User.id)
        if role:
            query = query.where(User.role == role.value)
        if is_active is not None:
            query = query.where(User.is_active == is_active)

        query = query.limit(min(limit, 100)).offset(offset)
        return list(db.scalars(query).all())

    @staticmethod
    def update_user_role(
        user_id: int,
        new_role: Role,
        current_user: User,
        db: Session,
    ) -> User:
        # Regla: Un usuario no puede cambiar su propio rol
        if user_id == current_user.id:
            raise ConflictError("No puedes modificar tu propio rol de usuario.")

        target_user = db.get(User, user_id)
        if not target_user:
            raise NotFoundError(f"Usuario con id {user_id} no encontrado.")

        # Regla: No se puede degradar al último administrador activo
        if target_user.role == Role.ADMIN.value and new_role != Role.ADMIN:
            active_admins = db.scalar(
                select(func.count(User.id)).where(
                    User.role == Role.ADMIN.value, User.is_active.is_(True)
                )
            )
            if active_admins is not None and active_admins <= 1:
                raise ConflictError("No se puede cambiar el rol del único administrador activo del sistema.")

        target_user.role = new_role.value
        db.commit()
        db.refresh(target_user)
        return target_user

    @staticmethod
    def update_user_status(
        user_id: int,
        is_active: bool,
        current_user: User,
        db: Session,
    ) -> User:
        # Regla: Un usuario no puede cambiar su propio estado
        if user_id == current_user.id:
            raise ConflictError("No puedes modificar el estado de tu propia cuenta.")

        target_user = db.get(User, user_id)
        if not target_user:
            raise NotFoundError(f"Usuario con id {user_id} no encontrado.")

        # Regla: No se puede desactivar al último administrador activo
        if target_user.role == Role.ADMIN.value and not is_active:
            active_admins = db.scalar(
                select(func.count(User.id)).where(
                    User.role == Role.ADMIN.value, User.is_active.is_(True)
                )
            )
            if active_admins is not None and active_admins <= 1:
                raise ConflictError("No se puede desactivar al único administrador activo del sistema.")

        target_user.is_active = is_active
        db.commit()
        db.refresh(target_user)
        return target_user
