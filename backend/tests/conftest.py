"""Pytest configuration, test fixtures, in-memory SQLite database, and HTTP test client."""

import os
# Configurar entorno de pruebas antes de cargar la configuración
os.environ["APP_ENV"] = "testing"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-for-unit-testing-32-chars-minimum"
os.environ["JWT_ALGORITHM"] = "HS256"
os.environ["AI_API_KEY"] = "mock-api-key-for-test"
os.environ["AI_MODEL"] = "gpt-4o-mini"
os.environ["ADMIN_EMAIL"] = "admin@campuslands.edu"
os.environ["ADMIN_PASSWORD"] = "AdminPassword123"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_password
from app.db.base import Base
import app.db.models  # Register all domain tables before create_all.
from app.db.session import get_db
from app.main import app
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.incidents.models import Incident, IncidentEvent
from app.modules.spaces.models import Space
from app.services.availability import OFFICIAL_SPACES


# Motor SQLite en memoria aislado por prueba con StaticPool
TEST_ENGINE = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=TEST_ENGINE, autoflush=False, autocommit=False)


@pytest.fixture(autouse=True)
def setup_test_db():
    """Crea todas las tablas antes de cada test y las elimina al finalizar."""
    Base.metadata.create_all(bind=TEST_ENGINE)
    with TestingSessionLocal() as session:
        session.add_all(
            Space(id=sid, name=info["name"], capacity=info["capacity"])
            for sid, info in OFFICIAL_SPACES.items()
        )
        session.commit()
    yield
    Base.metadata.drop_all(bind=TEST_ENGINE)


@pytest.fixture
def db_session():
    """Sesión de base de datos para pruebas."""
    with TestingSessionLocal() as session:
        yield session


@pytest.fixture
def client(db_session):
    """Cliente HTTP con inyección de la sesión de prueba."""
    def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db_session):
    user = User(
        name="Admin Test",
        email="admin@campuslands.edu",
        password_hash=hash_password("AdminPassword123"),
        role=Role.ADMIN.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def teacher_user(db_session):
    user = User(
        name="Docente Uno",
        email="docente1@campuslands.edu",
        password_hash=hash_password("TeacherPassword123"),
        role=Role.TEACHER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def teacher_user_two(db_session):
    user = User(
        name="Docente Dos",
        email="docente2@campuslands.edu",
        password_hash=hash_password("TeacherPassword123"),
        role=Role.TEACHER.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def support_user(db_session):
    user = User(
        name="Soporte Test",
        email="soporte@campuslands.edu",
        password_hash=hash_password("SupportPassword123"),
        role=Role.SUPPORT.value,
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def inactive_user(db_session):
    user = User(
        name="Inactivo Test",
        email="inactivo@campuslands.edu",
        password_hash=hash_password("InactivePassword123"),
        role=Role.TEACHER.value,
        is_active=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    token, _ = create_access_token(admin_user.id, admin_user.role)
    return token


@pytest.fixture
def teacher_token(teacher_user):
    token, _ = create_access_token(teacher_user.id, teacher_user.role)
    return token


@pytest.fixture
def support_token(support_user):
    token, _ = create_access_token(support_user.id, support_user.role)
    return token
