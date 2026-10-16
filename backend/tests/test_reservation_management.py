"""Authorization, atomic update, cancellation, and audit tests for HU-04."""

from sqlalchemy import func, select

from app.core.security import create_access_token
from app.modules.reservations.models import Reservation, ReservationEvent
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
        "title": "Clase original",
    }
    data.update(changes)
    return data


def create(client, token: str, **changes) -> dict:
    response = client.post("/reservations", json=payload(**changes), headers=auth(token))
    assert response.status_code == 201, response.text
    return response.json()


def test_teacher_lists_only_own_reservations_and_admin_lists_all(
    client,
    teacher_token,
    teacher_user,
    teacher_user_two,
    admin_token,
    support_token,
):
    second_token, _ = create_access_token(teacher_user_two.id, teacher_user_two.role)
    own = create(client, teacher_token)
    other = create(client, second_token, space_id="SAL-003")

    teacher_list = client.get("/reservations", headers=auth(teacher_token))
    admin_list = client.get("/reservations", headers=auth(admin_token))
    support_list = client.get("/reservations", headers=auth(support_token))

    assert [item["id"] for item in teacher_list.json()] == [own["id"]]
    assert {item["id"] for item in admin_list.json()} == {own["id"], other["id"]}
    assert all(item["user_id"] == teacher_user.id for item in teacher_list.json())
    assert support_list.status_code == 403


def test_teacher_cannot_manage_another_teachers_reservation_but_admin_can(
    client,
    teacher_token,
    teacher_user_two,
    admin_token,
):
    reservation = create(client, teacher_token)
    second_token, _ = create_access_token(teacher_user_two.id, teacher_user_two.role)

    forbidden_update = client.put(
        f"/reservations/{reservation['id']}",
        json={"title": "Intento ajeno"},
        headers=auth(second_token),
    )
    forbidden_cancel = client.delete(
        f"/reservations/{reservation['id']}",
        headers=auth(second_token),
    )
    admin_update = client.put(
        f"/reservations/{reservation['id']}",
        json={"title": "Ajuste administrativo"},
        headers=auth(admin_token),
    )

    assert forbidden_update.status_code == 403
    assert forbidden_cancel.status_code == 403
    assert admin_update.status_code == 200
    assert admin_update.json()["title"] == "Ajuste administrativo"
    assert admin_update.json()["events"][-1]["actor_id"] != reservation["user_id"]


def test_update_revalidates_conflicts_capacity_and_blocked_rooms_atomically(
    client,
    db_session,
    teacher_token,
):
    first = create(client, teacher_token)
    create(
        client,
        teacher_token,
        space_id="SAL-003",
        start_time="10:00",
        end_time="12:00",
        attendees=10,
        title="Reserva que produce conflicto",
    )

    overlap = client.put(
        f"/reservations/{first['id']}",
        json={"space_id": "SAL-003", "start_time": "11:00", "end_time": "13:00"},
        headers=auth(teacher_token),
    )
    over_capacity = client.put(
        f"/reservations/{first['id']}",
        json={"space_id": "SAL-008", "attendees": 20},
        headers=auth(teacher_token),
    )
    blocked_space = db_session.get(Space, "SAL-004")
    blocked_space.is_blocked = True
    db_session.commit()
    blocked = client.put(
        f"/reservations/{first['id']}",
        json={"space_id": "SAL-004"},
        headers=auth(teacher_token),
    )

    assert overlap.status_code == 409
    assert over_capacity.status_code == 409
    assert blocked.status_code == 409
    db_session.expire_all()
    persisted = db_session.get(Reservation, first["id"])
    assert persisted.space_id == "SAL-002"
    assert persisted.start_time.isoformat() == "08:00:00"
    assert persisted.attendees == 20


def test_cancel_preserves_history_and_releases_availability(
    client,
    db_session,
    teacher_token,
):
    reservation = create(client, teacher_token)
    availability_params = {
        "date": "2026-10-20",
        "start_time": "08:30",
        "end_time": "09:30",
    }
    before = client.get("/spaces", params=availability_params, headers=auth(teacher_token))
    cancelled = client.delete(
        f"/reservations/{reservation['id']}",
        headers=auth(teacher_token),
    )
    after = client.get("/spaces", params=availability_params, headers=auth(teacher_token))

    before_cosmos = next(item for item in before.json() if item["id"] == "SAL-002")
    after_cosmos = next(item for item in after.json() if item["id"] == "SAL-002")
    assert before_cosmos["status"] == "occupied"
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"
    assert [event["event_type"] for event in cancelled.json()["events"]] == ["created", "cancelled"]
    assert after_cosmos["status"] == "available"
    assert db_session.get(Reservation, reservation["id"]) is not None
    assert db_session.scalar(
        select(func.count()).select_from(ReservationEvent).where(
            ReservationEvent.reservation_id == reservation["id"]
        )
    ) == 2


def test_cancelled_reservation_cannot_be_changed_or_cancelled_twice(client, teacher_token):
    reservation = create(client, teacher_token)
    first_cancel = client.delete(
        f"/reservations/{reservation['id']}",
        headers=auth(teacher_token),
    )
    update = client.put(
        f"/reservations/{reservation['id']}",
        json={"title": "Cambio inválido"},
        headers=auth(teacher_token),
    )
    second_cancel = client.delete(
        f"/reservations/{reservation['id']}",
        headers=auth(teacher_token),
    )

    assert first_cancel.status_code == 200
    assert update.status_code == 409
    assert second_cancel.status_code == 409
