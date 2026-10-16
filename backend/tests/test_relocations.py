"""Affected-reservation, recommendation, and confirmation tests for HU-05."""

from datetime import date, timedelta

from app.modules.reservations.models import Reservation
from app.modules.spaces.models import Space


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def future_date(days: int = 7) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def payload(**changes) -> dict:
    data = {
        "space_id": "SAL-002",
        "date": future_date(),
        "start_time": "08:00",
        "end_time": "10:00",
        "attendees": 20,
        "title": "Clase afectada",
    }
    data.update(changes)
    return data


def create(client, token: str, **changes) -> dict:
    response = client.post("/reservations", json=payload(**changes), headers=auth(token))
    assert response.status_code == 201, response.text
    return response.json()


def block_space(db_session, space_id: str) -> None:
    space = db_session.get(Space, space_id)
    space.is_blocked = True
    db_session.commit()


def test_only_admin_lists_future_confirmed_reservations_in_blocked_spaces(
    client,
    db_session,
    admin_token,
    teacher_token,
):
    affected = create(client, teacher_token)
    create(client, teacher_token, space_id="SAL-003", title="Reserva operativa")
    block_space(db_session, "SAL-002")

    admin_response = client.get("/reservations/affected", headers=auth(admin_token))
    teacher_response = client.get("/reservations/affected", headers=auth(teacher_token))

    assert admin_response.status_code == 200
    assert [item["id"] for item in admin_response.json()] == [affected["id"]]
    assert teacher_response.status_code == 403


def test_relocation_options_exclude_blocked_occupied_and_small_rooms(
    client,
    db_session,
    admin_token,
    teacher_token,
):
    affected = create(client, teacher_token)
    create(
        client,
        teacher_token,
        space_id="SAL-003",
        attendees=10,
        title="Ocupa Skylab",
    )
    block_space(db_session, "SAL-002")
    block_space(db_session, "SAL-010")

    response = client.get(
        f"/reservations/{affected['id']}/reallocations",
        headers=auth(admin_token),
    )

    assert response.status_code == 200, response.text
    body = response.json()
    ids = [item["id"] for item in body["alternatives"]]
    assert body["affected"] is True
    assert body["resources_checked"] is False
    assert "SAL-002" not in ids
    assert "SAL-003" not in ids
    assert "SAL-010" not in ids
    assert all(item_id not in ids for item_id in ["SAL-006", "SAL-007", "SAL-008", "SAL-009"])
    assert ids == ["SAL-005", "SAL-004", "SAL-001"]


def test_reports_when_no_compatible_alternative_exists(
    client,
    db_session,
    admin_token,
):
    affected = create(
        client,
        admin_token,
        space_id="SAL-001",
        attendees=100,
        title="Evento de aforo máximo",
    )
    block_space(db_session, "SAL-001")

    response = client.get(
        f"/reservations/{affected['id']}/reallocations",
        headers=auth(admin_token),
    )

    assert response.status_code == 200
    assert response.json()["alternatives"] == []
    assert "No existe" in response.json()["explanation"]


def test_only_admin_confirms_relocation_and_audit_is_preserved(
    client,
    db_session,
    admin_token,
    teacher_token,
):
    affected = create(client, teacher_token)
    block_space(db_session, "SAL-002")

    forbidden = client.post(
        f"/reservations/{affected['id']}/reallocate",
        json={"new_space_id": "SAL-003"},
        headers=auth(teacher_token),
    )
    confirmed = client.post(
        f"/reservations/{affected['id']}/reallocate",
        json={"new_space_id": "SAL-003", "notes": "Cambio aprobado"},
        headers=auth(admin_token),
    )

    assert forbidden.status_code == 403
    assert confirmed.status_code == 200, confirmed.text
    assert confirmed.json()["space_id"] == "SAL-003"
    assert confirmed.json()["events"][-1]["event_type"] == "relocated"
    assert "SAL-002" in confirmed.json()["events"][-1]["details"]
    assert "SAL-003" in confirmed.json()["events"][-1]["details"]
    db_session.expire_all()
    assert db_session.get(Reservation, affected["id"]).space_id == "SAL-003"


def test_confirmation_rechecks_destination_after_recommendation(
    client,
    db_session,
    admin_token,
    teacher_token,
):
    affected = create(client, teacher_token)
    block_space(db_session, "SAL-002")
    options = client.get(
        f"/reservations/{affected['id']}/reallocations",
        headers=auth(admin_token),
    )
    target = options.json()["alternatives"][0]["id"]
    create(
        client,
        teacher_token,
        space_id=target,
        attendees=5,
        title="Reserva creada después de recomendar",
    )

    response = client.post(
        f"/reservations/{affected['id']}/reallocate",
        json={"new_space_id": target},
        headers=auth(admin_token),
    )

    assert response.status_code == 409
    db_session.expire_all()
    assert db_session.get(Reservation, affected["id"]).space_id == "SAL-002"


def test_non_affected_or_cancelled_reservation_cannot_be_relocated(
    client,
    db_session,
    admin_token,
):
    reservation = create(client, admin_token)
    not_affected = client.get(
        f"/reservations/{reservation['id']}/reallocations",
        headers=auth(admin_token),
    )
    block_space(db_session, "SAL-002")
    client.delete(f"/reservations/{reservation['id']}", headers=auth(admin_token))
    cancelled = client.post(
        f"/reservations/{reservation['id']}/reallocate",
        json={"new_space_id": "SAL-003"},
        headers=auth(admin_token),
    )

    assert not_affected.status_code == 409
    assert cancelled.status_code == 409
