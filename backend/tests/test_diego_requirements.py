"""Diego (D-01..D-07): aforo, horario operativo y recomendaciones de salas."""

from app.modules.reservations.models import Reservation
from sqlalchemy import func, select


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def payload(**changes):
    data = {
        "space_id": "SAL-004",
        "date": "2026-10-20",
        "start_time": "08:00",
        "end_time": "10:00",
        "attendees": 30,
        "title": "Clase",
    }
    data.update(changes)
    return data


def test_d01_sputnik_45_attendees_rejected(client, db_session, teacher_token):
    r = client.post("/reservations", json=payload(attendees=45), headers=auth(teacher_token))
    assert r.status_code == 409
    assert "38" in r.json()["error"]["message"]
    assert db_session.scalar(select(func.count()).select_from(Reservation)) == 0


def test_d01_sputnik_38_attendees_accepted(client, teacher_token):
    r = client.post("/reservations", json=payload(attendees=38), headers=auth(teacher_token))
    assert r.status_code == 201, r.text


def test_d06_outside_campus_hours_rejected(client, db_session, teacher_token):
    early = client.post(
        "/reservations", json=payload(start_time="05:00", end_time="07:00"), headers=auth(teacher_token)
    )
    late = client.post(
        "/reservations", json=payload(start_time="21:00", end_time="23:00"), headers=auth(teacher_token)
    )
    assert early.status_code == 422
    assert late.status_code == 422
    assert db_session.scalar(select(func.count()).select_from(Reservation)) == 0


def test_d06_boundary_hours_accepted(client, teacher_token):
    r = client.post(
        "/reservations", json=payload(start_time="06:00", end_time="22:00"), headers=auth(teacher_token)
    )
    assert r.status_code == 201, r.text


def test_d02_recommendation_for_45_excludes_sputnik(client, teacher_token):
    r = client.post(
        "/recommendations/spaces",
        json={"attendees": 45, "date": "2026-10-20", "start_time": "08:00", "end_time": "10:00"},
        headers=auth(teacher_token),
    )
    assert r.status_code == 200, r.text
    body = r.json()
    ids = [s["id"] for s in body["recommendations"]]
    assert "SAL-004" not in ids
    assert "SAL-001" in ids
    assert all(s["capacity"] >= 45 for s in body["recommendations"])
    assert body["confirmed"] is False


def test_d03_recommendation_excludes_occupied_space(client, teacher_token):
    client.post(
        "/reservations",
        json=payload(space_id="SAL-001", attendees=50),
        headers=auth(teacher_token),
    )
    r = client.post(
        "/recommendations/spaces",
        json={"attendees": 45, "date": "2026-10-20", "start_time": "09:00", "end_time": "11:00"},
        headers=auth(teacher_token),
    )
    assert "SAL-001" not in [s["id"] for s in r.json()["recommendations"]]


def test_d04_d05_consecutive_queries_recalculate(client, teacher_token):
    for attendees in (5, 20, 36, 45, 99):
        r = client.post(
            "/recommendations/spaces",
            json={"attendees": attendees, "date": "2026-10-20", "start_time": "08:00", "end_time": "09:00"},
            headers=auth(teacher_token),
        )
        assert r.status_code == 200
        assert all(s["capacity"] >= attendees for s in r.json()["recommendations"])


def test_recommendation_rejects_hours_outside_campus(client, teacher_token):
    r = client.post(
        "/recommendations/spaces",
        json={"attendees": 5, "date": "2026-10-20", "start_time": "05:00", "end_time": "07:00"},
        headers=auth(teacher_token),
    )
    assert r.status_code == 422


def test_d09_rules_cable_and_no_substring_false_positive():
    from app.modules.recommendations.classifier_rules import classify_by_rules
    from app.modules.incidents.enums import IncidentCategory

    hdmi = classify_by_rules("Se dañó el cable HDMI del proyector")
    assert hdmi["category"] == IncidentCategory.TECHNOLOGY
    bare = classify_by_rules("Hay un cable pelado con chispas")
    assert bare["category"] == IncidentCategory.SAFETY
    assert bare["suggests_blocking"] is True
    wall = classify_by_rules("La pared tiene humedad")
    assert wall["category"] == IncidentCategory.INFRASTRUCTURE
