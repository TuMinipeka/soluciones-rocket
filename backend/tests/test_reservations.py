"""Acceptance and concurrency tests for HU-03 reservation creation."""

from concurrent.futures import ThreadPoolExecutor
from datetime import date, time
from threading import Barrier

from sqlalchemy import create_engine, event, func, select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError
from app.db.base import Base
from app.db.session import enable_sqlite_foreign_keys
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.reservations.models import Reservation
from app.modules.reservations.schemas import ReservationCreate
from app.modules.reservations.service import create_reservation
from app.modules.spaces.models import Space


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def payload(**changes) -> dict:
    data = {
        "space_id": "SAL-002",
        "date": "2026-10-20",
        "start_time": "08:00",
        "end_time": "10:00",
        "attendees": 20,
        "title": "Clase de programación",
    }
    data.update(changes)
    return data


def test_creates_and_persists_confirmed_reservation(
    client,
    db_session,
    teacher_user,
    teacher_token,
):
    response = client.post("/reservations", json=payload(), headers=auth(teacher_token))

    assert response.status_code == 201, response.text
    body = response.json()
    assert body["space_id"] == "SAL-002"
    assert body["space_name"] == "Cosmos"
    assert body["user_id"] == teacher_user.id
    assert body["status"] == "confirmed"
    persisted = db_session.get(Reservation, body["id"])
    assert persisted is not None
    assert persisted.attendees == 20


def test_requires_authentication_and_reserving_role(client, support_token):
    anonymous = client.post("/reservations", json=payload())
    support = client.post("/reservations", json=payload(), headers=auth(support_token))

    assert anonymous.status_code == 401
    assert anonymous.json()["error"]["code"] == "UNAUTHORIZED"
    assert support.status_code == 403
    assert support.json()["error"]["code"] == "FORBIDDEN"


def test_rejects_unknown_blocked_or_over_capacity_space(
    client,
    db_session,
    teacher_token,
):
    missing = client.post(
        "/reservations",
        json=payload(space_id="SAL-999"),
        headers=auth(teacher_token),
    )
    blocked_space = db_session.get(Space, "SAL-002")
    blocked_space.is_blocked = True
    db_session.commit()
    blocked = client.post("/reservations", json=payload(), headers=auth(teacher_token))
    blocked_space.is_blocked = False
    db_session.commit()
    over_capacity = client.post(
        "/reservations",
        json=payload(attendees=30),
        headers=auth(teacher_token),
    )

    assert missing.status_code == 404
    assert blocked.status_code == 409
    assert over_capacity.status_code == 409
    assert db_session.scalar(select(func.count()).select_from(Reservation)) == 0


def test_rejects_overlap_but_accepts_adjacent_schedule(client, teacher_token):
    first = client.post("/reservations", json=payload(), headers=auth(teacher_token))
    overlapping = client.post(
        "/reservations",
        json=payload(start_time="09:00", end_time="11:00"),
        headers=auth(teacher_token),
    )
    adjacent = client.post(
        "/reservations",
        json=payload(start_time="10:00", end_time="12:00", title="Clase siguiente"),
        headers=auth(teacher_token),
    )

    assert first.status_code == 201
    assert overlapping.status_code == 409
    assert overlapping.json()["error"]["code"] == "CONFLICT"
    assert adjacent.status_code == 201


def test_rejects_invalid_interval_and_attendee_count(client, teacher_token):
    reversed_interval = client.post(
        "/reservations",
        json=payload(start_time="12:00", end_time="10:00"),
        headers=auth(teacher_token),
    )
    no_attendees = client.post(
        "/reservations",
        json=payload(attendees=0),
        headers=auth(teacher_token),
    )

    assert reversed_interval.status_code == 422
    assert reversed_interval.json()["error"]["code"] == "VALIDATION_ERROR"
    assert no_attendees.status_code == 422
    assert no_attendees.json()["error"]["code"] == "VALIDATION_ERROR"


def test_concurrent_overlapping_requests_create_only_one_reservation(tmp_path):
    database = tmp_path / "concurrent-reservations.db"
    engine = create_engine(
        f"sqlite:///{database}",
        connect_args={"check_same_thread": False, "timeout": 10},
    )
    event.listen(engine, "connect", enable_sqlite_foreign_keys)
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        db.add(
            User(
                id=1,
                name="Docente",
                email="docente@example.test",
                password_hash="not-used-here",
                role=Role.TEACHER.value,
            )
        )
        db.add(Space(id="SAL-002", name="Cosmos", capacity=25))
        db.commit()

    request = ReservationCreate(
        space_id="SAL-002",
        date=date(2026, 10, 20),
        start_time=time(8),
        end_time=time(10),
        attendees=20,
        title="Solicitud concurrente",
    )
    barrier = Barrier(2)

    def attempt() -> str:
        with Session(engine) as db:
            teacher = db.get(User, 1)
            barrier.wait()
            try:
                create_reservation(request, teacher, db)
            except ConflictError:
                return "conflict"
            return "created"

    with ThreadPoolExecutor(max_workers=2) as pool:
        outcomes = sorted(pool.map(lambda _: attempt(), range(2)))

    assert outcomes == ["conflict", "created"]
    with Session(engine) as db:
        assert db.scalar(select(func.count()).select_from(Reservation)) == 1
    engine.dispose()
