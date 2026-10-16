"""Acceptance and business-rule tests for HU-02 room availability."""

from datetime import date, time

from app.modules.reservations.models import Reservation
from app.modules.spaces.models import Space


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def add_reservation(
    db_session,
    user_id: int,
    space_id: str,
    start_time: time,
    end_time: time,
    *,
    reservation_date: date = date(2026, 10, 20),
    status: str = "confirmed",
) -> None:
    db_session.add(
        Reservation(
            space_id=space_id,
            user_id=user_id,
            date=reservation_date,
            start_time=start_time,
            end_time=end_time,
            attendees=5,
            title="Prueba de disponibilidad",
            status=status,
        )
    )
    db_session.commit()


def test_spaces_requires_authentication(client):
    response = client.get("/spaces")

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_lists_the_ten_persisted_official_spaces(client, teacher_token):
    response = client.get("/spaces", headers=auth(teacher_token))

    assert response.status_code == 200
    spaces = response.json()
    assert len(spaces) == 10
    assert [space["id"] for space in spaces] == [f"SAL-{number:03d}" for number in range(1, 11)]
    cosmos = next(space for space in spaces if space["id"] == "SAL-002")
    assert cosmos == {
        "id": "SAL-002",
        "name": "Cosmos",
        "capacity": 25,
        "status": "available",
        "is_blocked": False,
        "has_conflict": False,
    }


def test_availability_uses_only_overlapping_confirmed_reservations(
    client,
    db_session,
    teacher_user,
    teacher_token,
):
    blocked = db_session.get(Space, "SAL-001")
    blocked.is_blocked = True
    db_session.commit()
    add_reservation(db_session, teacher_user.id, "SAL-002", time(9), time(11))
    add_reservation(
        db_session,
        teacher_user.id,
        "SAL-003",
        time(9),
        time(11),
        status="cancelled",
    )
    add_reservation(
        db_session,
        teacher_user.id,
        "SAL-004",
        time(9),
        time(11),
        reservation_date=date(2026, 10, 21),
    )

    response = client.get(
        "/spaces",
        params={"date": "2026-10-20", "start_time": "10:00", "end_time": "12:00"},
        headers=auth(teacher_token),
    )

    assert response.status_code == 200
    spaces = {space["id"]: space for space in response.json()}
    assert spaces["SAL-001"]["status"] == "disabled"
    assert spaces["SAL-002"]["status"] == "occupied"
    assert spaces["SAL-002"]["has_conflict"] is True
    assert spaces["SAL-003"]["status"] == "available"
    assert spaces["SAL-004"]["status"] == "available"


def test_adjacent_reservation_does_not_create_conflict(
    client,
    db_session,
    teacher_user,
    teacher_token,
):
    add_reservation(db_session, teacher_user.id, "SAL-002", time(8), time(10))

    response = client.get(
        "/spaces",
        params={"date": "2026-10-20", "start_time": "10:00", "end_time": "11:00"},
        headers=auth(teacher_token),
    )

    cosmos = next(space for space in response.json() if space["id"] == "SAL-002")
    assert cosmos["status"] == "available"
    assert cosmos["has_conflict"] is False


def test_rejects_partial_or_reversed_interval(client, teacher_token):
    partial = client.get(
        "/spaces",
        params={"date": "2026-10-20"},
        headers=auth(teacher_token),
    )
    reversed_interval = client.get(
        "/spaces",
        params={"date": "2026-10-20", "start_time": "12:00", "end_time": "10:00"},
        headers=auth(teacher_token),
    )

    assert partial.status_code == 422
    assert partial.json()["error"]["code"] == "VALIDATION_ERROR"
    assert reversed_interval.status_code == 422
    assert reversed_interval.json()["error"]["code"] == "VALIDATION_ERROR"


def test_get_space_returns_persisted_room_or_not_found(client, teacher_token):
    found = client.get("/spaces/sal-010", headers=auth(teacher_token))
    missing = client.get("/spaces/SAL-999", headers=auth(teacher_token))

    assert found.status_code == 200
    assert found.json()["name"] == "Artemis"
    assert found.json()["capacity"] == 32
    assert missing.status_code == 404
    assert missing.json()["error"]["code"] == "NOT_FOUND"


def test_get_space_calculates_availability_for_requested_interval(
    client, db_session, teacher_user, teacher_token
):
    add_reservation(db_session, teacher_user.id, "SAL-002", time(9), time(10))

    occupied = client.get(
        "/spaces/SAL-002",
        params={"date": "2026-10-20", "start_time": "09:30", "end_time": "10:30"},
        headers=auth(teacher_token),
    )
    assert occupied.status_code == 200
    assert occupied.json()["status"] == "occupied"
    assert occupied.json()["has_conflict"] is True

    available = client.get(
        "/spaces/SAL-002",
        params={"date": "2026-10-20", "start_time": "10:00", "end_time": "11:00"},
        headers=auth(teacher_token),
    )
    assert available.status_code == 200
    assert available.json()["status"] == "available"
