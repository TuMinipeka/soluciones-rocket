"""Acceptance checks for Mayorga's persistence, seed, and loan flow."""

from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier

import pytest
from sqlalchemy import create_engine, event, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session

from app.db.base import Base
from app.db.session import enable_sqlite_foreign_keys
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.resources.models import Loan, Resource
from app.modules.resources.schemas import LoanCreate
from app.modules.resources.service import create_loan, return_loan
from app.modules.reservations.models import Reservation
from app.modules.spaces.models import Space
from app.scripts.seed_demo import seed_demo
from app.services.resources import get_resource_alternatives
from app.services.availability import OFFICIAL_SPACES


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_seed_is_idempotent_and_preserves_existing_accounts(db_session):
    db_session.query(Space).delete()
    db_session.commit()
    accounts = [
        ("Admin Demo", "demo-admin@example.test", "DemoAdmin123", Role.ADMIN),
        ("Teacher Demo", "demo-teacher@example.test", "DemoTeacher123", Role.TEACHER),
        ("Support Demo", "demo-support@example.test", "DemoSupport123", Role.SUPPORT),
    ]
    assert seed_demo(db_session, accounts) == {"rooms_created": 10, "users_created": 3}
    admin = db_session.scalar(select(User).where(User.email == "demo-admin@example.test"))
    original_hash = admin.password_hash
    assert seed_demo(db_session, accounts) == {"rooms_created": 0, "users_created": 0}
    assert db_session.scalar(select(func.count()).select_from(Space)) == 10
    assert admin.password_hash == original_hash
    assert {room.id: room.capacity for room in db_session.scalars(select(Space))} == {
        sid: info["capacity"] for sid, info in OFFICIAL_SPACES.items()
    }
    assert db_session.scalar(select(func.count()).select_from(Loan)) == 0


def test_seed_rejects_changed_official_room_without_partial_users(db_session):
    room = db_session.get(Space, "SAL-002")
    room.capacity = 30
    db_session.commit()
    with pytest.raises(ValueError, match="SAL-002"):
        seed_demo(db_session, [("Admin Demo", "another@example.test", "DemoAdmin123", Role.ADMIN)])
    assert db_session.scalar(select(User).where(User.email == "another@example.test")) is None
    assert db_session.get(Space, "SAL-002").capacity == 30


def test_seed_migrates_legacy_room_names_without_breaking_reservations(
    db_session, teacher_user
):
    legacy_names = {
        "SAL-003": "Skilab",
        "SAL-004": "Spooki",
        "SAL-006": "Blanca",
    }
    for space_id, legacy_name in legacy_names.items():
        db_session.get(Space, space_id).name = legacy_name
    reservation = Reservation(
        space_id="SAL-004",
        user_id=teacher_user.id,
        date=datetime.now(timezone.utc).date() + timedelta(days=1),
        start_time=datetime.strptime("08:00", "%H:%M").time(),
        end_time=datetime.strptime("09:00", "%H:%M").time(),
        attendees=10,
        title="Reserva conservada",
        status="confirmed",
    )
    db_session.add(reservation)
    db_session.commit()
    reservation_id = reservation.id

    seed_demo(db_session, [])

    assert db_session.get(Space, "SAL-003").name == "Skylab"
    assert db_session.get(Space, "SAL-004").name == "Sputnik"
    assert db_session.get(Space, "SAL-006").name == "Sala Nueva"
    assert db_session.get(Reservation, reservation_id).space_id == "SAL-004"


def test_inventory_and_loan_lifecycle(client, admin_token, teacher_token, support_token):
    data = {"id": "EQ-001", "name": "Proyector autorizado", "category": "projector"}
    assert client.post("/resources", json=data, headers=auth(teacher_token)).status_code == 403
    created = client.post("/resources", json=data, headers=auth(admin_token))
    assert created.status_code == 201, created.text
    assert created.json()["status"] == "available"
    assert client.get("/resources", headers=auth(teacher_token)).json()[0]["id"] == "EQ-001"
    assert client.post("/resources", json=data, headers=auth(admin_token)).status_code == 409

    support_resource = {
        "id": "EQ-SUPPORT",
        "name": "Equipo autorizado por soporte",
        "category": "laptop",
    }
    support_created = client.post(
        "/resources", json=support_resource, headers=auth(support_token)
    )
    assert support_created.status_code == 201
    assert support_created.json()["id"] == "EQ-SUPPORT"

    start = datetime.now(timezone.utc) + timedelta(minutes=2)
    payload = {
        "resource_id": "EQ-001",
        "start_time": start.isoformat(),
        "expected_return": (start + timedelta(hours=2)).isoformat(),
    }
    assert client.post("/resources/loans", json=payload, headers=auth(support_token)).status_code == 403
    first = client.post("/resources/loans", json=payload, headers=auth(teacher_token))
    assert first.status_code == 201, first.text
    loan_id = first.json()["id"]
    assert client.get("/resources/EQ-001", headers=auth(admin_token)).json()["status"] == "loaned"
    assert client.post("/resources/loans", json=payload, headers=auth(admin_token)).status_code == 409
    assert client.post(f"/resources/loans/{loan_id}/return", headers=auth(teacher_token)).status_code == 200
    assert client.get("/resources/EQ-001", headers=auth(admin_token)).json()["status"] == "available"
    assert client.post("/resources/loans", json=payload, headers=auth(admin_token)).status_code == 201

    damaged = client.patch(
        "/resources/EQ-001", json={"condition": "damaged"}, headers=auth(admin_token)
    )
    assert damaged.status_code == 200
    assert damaged.json()["status"] == "disabled"
    later = dict(payload, start_time=(start + timedelta(days=1)).isoformat(),
                 expected_return=(start + timedelta(days=1, hours=2)).isoformat())
    assert client.post("/resources/loans", json=later, headers=auth(teacher_token)).status_code == 409


def test_incident_resource_block_is_persisted(client, db_session, admin_token, support_token):
    client.post(
        "/resources",
        json={"id": "EQ-002", "name": "Portátil autorizado", "category": "laptop"},
        headers=auth(admin_token),
    )
    report = client.post(
        "/incidents",
        json={
            "description": "El equipo presenta humo y chispas al encender.",
            "resource_id": "EQ-002",
            "category": "electrical",
            "priority": "critical",
            "confirm_blocking": True,
        },
        headers=auth(support_token),
    )
    assert report.status_code == 201, report.text
    assert db_session.get(Resource, "EQ-002").is_blocked is True
    assert client.get("/resources/EQ-002", headers=auth(admin_token)).json()["status"] == "disabled"
    resolved = client.post(f"/incidents/{report.json()['id']}/resolve", headers=auth(support_token))
    assert resolved.status_code == 200, resolved.text
    db_session.expire_all()
    assert db_session.get(Resource, "EQ-002").is_blocked is False


def test_confirming_and_returning_loan_updates_resource_availability(
    client, admin_token, teacher_token
):
    headers = auth(admin_token)
    created = client.post(
        "/resources",
        json={"id": "EQ-STATUS", "name": "Equipo de estado", "category": "laptop"},
        headers=headers,
    )
    assert created.status_code == 201
    assert created.json()["status"] == "available"

    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    loan = client.post(
        "/resources/loans",
        json={
            "resource_id": "EQ-STATUS",
            "start_time": start.isoformat(),
            "expected_return": (start + timedelta(hours=1)).isoformat(),
        },
        headers=auth(teacher_token),
    )
    assert loan.status_code == 201
    assert client.get("/resources/EQ-STATUS", headers=headers).json()["status"] == "loaned"

    returned = client.post(
        f"/resources/loans/{loan.json()['id']}/return",
        headers=auth(teacher_token),
    )
    assert returned.status_code == 200
    assert client.get("/resources/EQ-STATUS", headers=headers).json()["status"] == "available"


def test_teacher_can_list_and_request_support_authorized_resource(
    client, support_token, teacher_token
):
    created = client.post(
        "/resources",
        json={"id": "EQ-AUTHORIZED", "name": "Tableta autorizada", "category": "tablet"},
        headers=auth(support_token),
    )
    assert created.status_code == 201

    resources = client.get("/resources", headers=auth(teacher_token))
    assert resources.status_code == 200
    assert "EQ-AUTHORIZED" in {resource["id"] for resource in resources.json()}

    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    requested = client.post(
        "/resources/loans",
        json={
            "resource_id": "EQ-AUTHORIZED",
            "start_time": start.isoformat(),
            "expected_return": (start + timedelta(hours=2)).isoformat(),
            "notes": "Clase autorizada",
        },
        headers=auth(teacher_token),
    )
    assert requested.status_code == 201
    assert requested.json()["resource_id"] == "EQ-AUTHORIZED"


def test_failed_loan_commit_never_reports_success_or_persists_partial_row(
    client, db_session, teacher_token, monkeypatch
):
    db_session.add(Resource(id="EQ-ROLLBACK", name="Equipo transaccional", category="laptop"))
    db_session.commit()

    def fail_commit():
        raise OperationalError("COMMIT", {}, RuntimeError("disk unavailable"))

    monkeypatch.setattr(db_session, "commit", fail_commit)
    start = datetime.now(timezone.utc) + timedelta(minutes=5)
    response = client.post(
        "/resources/loans",
        json={
            "resource_id": "EQ-ROLLBACK",
            "start_time": start.isoformat(),
            "expected_return": (start + timedelta(hours=1)).isoformat(),
        },
        headers=auth(teacher_token),
    )

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "DATABASE_UNAVAILABLE"
    assert db_session.scalar(
        select(func.count()).select_from(Loan).where(Loan.resource_id == "EQ-ROLLBACK")
    ) == 0


def test_incident_rejects_unknown_equipment(client, support_token):
    response = client.post(
        "/incidents",
        json={"description": "El equipo inexistente presenta humo.", "resource_id": "EQ-UNKNOWN"},
        headers=auth(support_token),
    )
    assert response.status_code == 422


def test_resource_alternatives_use_only_registered_available_inventory(db_session):
    db_session.add_all([
        Resource(id="EQ-010", name="Portátil A", category="laptop"),
        Resource(id="EQ-011", name="Portátil B", category="laptop"),
        Resource(id="EQ-012", name="Portátil dañado", category="laptop", condition="damaged"),
    ])
    db_session.commit()
    assert [item["id"] for item in get_resource_alternatives("EQ-010", db_session)] == ["EQ-011"]


def test_sqlite_reopen_preserves_rows_and_enforces_foreign_keys(tmp_path):
    database = tmp_path / "campus-test.db"
    engine = create_engine(f"sqlite:///{database}")
    event.listen(engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add(Space(id="SAL-002", name="Cosmos", capacity=25))
        db.commit()
    engine.dispose()

    reopened = create_engine(f"sqlite:///{database}")
    event.listen(reopened, "connect", enable_sqlite_foreign_keys)
    with reopened.connect() as connection:
        assert connection.scalar(text("PRAGMA foreign_keys")) == 1
        assert connection.scalar(text("SELECT capacity FROM spaces WHERE id='SAL-002'")) == 25
    with Session(reopened) as db:
        db.add(Loan(resource_id="EQ-NOT-FOUND", borrower_id=999,
                    start_time=datetime(2026, 10, 16), expected_return=datetime(2026, 10, 17)))
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    reopened.dispose()


def test_loan_and_return_state_survive_new_database_sessions(tmp_path):
    database = tmp_path / "loan-persistence.db"
    engine = create_engine(f"sqlite:///{database}")
    event.listen(engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    start = datetime.now(timezone.utc) + timedelta(hours=1)

    with Session(engine) as db:
        borrower = User(
            name="Docente persistencia",
            email="persistence@example.test",
            password_hash="not-used-here",
            role=Role.TEACHER.value,
        )
        db.add_all([borrower, Resource(id="EQ-PERSIST", name="Portátil", category="laptop")])
        db.commit()
        db.refresh(borrower)
        loan = create_loan(
            LoanCreate(
                resource_id="EQ-PERSIST",
                start_time=start,
                expected_return=start + timedelta(hours=2),
            ),
            borrower,
            db,
        )
        loan_id = loan.id
        borrower_id = borrower.id

    with Session(engine) as db:
        persisted = db.get(Loan, loan_id)
        assert persisted is not None
        assert persisted.resource_id == "EQ-PERSIST"
        assert persisted.returned_at is None
        return_loan(loan_id, db.get(User, borrower_id), db)

    engine.dispose()
    reopened = create_engine(f"sqlite:///{database}")
    event.listen(reopened, "connect", enable_sqlite_foreign_keys)
    with Session(reopened) as db:
        assert db.get(Loan, loan_id).returned_at is not None
    reopened.dispose()


def test_concurrent_overlapping_loans_only_create_one(tmp_path):
    database = tmp_path / "concurrent.db"
    engine = create_engine(f"sqlite:///{database}", connect_args={"check_same_thread": False})
    event.listen(engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add(User(id=1, name="Docente", email="docente@example.test",
                    password_hash="not-used-here", role=Role.TEACHER.value))
        db.add(Resource(id="EQ-100", name="Portátil", category="laptop"))
        db.commit()

    start = datetime.now(timezone.utc) + timedelta(hours=1)
    data = LoanCreate(resource_id="EQ-100", start_time=start,
                      expected_return=start + timedelta(hours=2))
    barrier = Barrier(2)

    def attempt() -> str:
        with Session(engine) as db:
            borrower = db.get(User, 1)
            barrier.wait()
            try:
                create_loan(data, borrower, db)
            except Exception as exc:
                return type(exc).__name__
            return "created"

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = list(pool.map(lambda _: attempt(), range(2)))
    assert sorted(outcomes) == ["ConflictError", "created"]
    with Session(engine) as db:
        assert db.scalar(select(func.count()).select_from(Loan)) == 1
    engine.dispose()
