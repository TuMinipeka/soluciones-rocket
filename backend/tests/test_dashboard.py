"""Operational summary must reflect the same persisted records as module APIs."""

from datetime import date, datetime, time

from app.modules.incidents.models import Incident
from app.modules.reservations.models import Reservation
from app.modules.resources.models import Loan, Resource
from app.modules.spaces.models import Space


def test_summary_requires_authentication(client):
    response = client.get("/dashboard/summary")
    assert response.status_code == 401


def test_summary_counts_live_records_and_room_interval(client, db_session, teacher_user, teacher_token):
    db_session.get(Space, "SAL-001").is_blocked = True
    db_session.add(
        Reservation(
            space_id="SAL-002",
            user_id=teacher_user.id,
            date=date(2026, 10, 20),
            start_time=time(9),
            end_time=time(11),
            attendees=20,
            title="Clase de prueba",
            status="confirmed",
        )
    )
    db_session.add_all(
        [
            Resource(id="EQ-001", name="Equipo prestado", category="laptop"),
            Resource(id="EQ-002", name="Equipo dañado", category="projector", condition="damaged"),
            Incident(reporter_id=teacher_user.id, description="Falla abierta", status="open"),
            Incident(reporter_id=teacher_user.id, description="Falla en atención", status="in_progress"),
        ]
    )
    db_session.flush()
    db_session.add(
        Loan(
            resource_id="EQ-001",
            borrower_id=teacher_user.id,
            start_time=datetime(2026, 10, 20, 9),
            expected_return=datetime(2026, 10, 20, 12),
        )
    )
    db_session.commit()

    response = client.get(
        "/dashboard/summary",
        params={"date": "2026-10-20", "start_time": "10:00", "end_time": "12:00"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert response.status_code == 200
    assert response.json() == {
        "available_spaces": 8,
        "occupied_spaces": 1,
        "disabled_spaces": 1,
        "active_loans": 1,
        "disabled_resources": 1,
        "open_incidents": 1,
        "in_progress_incidents": 1,
    }

    invalid = client.get(
        "/dashboard/summary",
        params={"date": "2026-10-20"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert invalid.status_code == 422
