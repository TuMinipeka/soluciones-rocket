"""Opt-in, clearly marked demo scenarios; never invent equipment inventory."""

import argparse
import os
import sys
from datetime import date, datetime, time, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.incidents.models import Incident, IncidentEvent
from app.modules.reservations.models import Reservation
from app.modules.resources.models import Loan, Resource
from app.modules.spaces.models import Space
from app.scripts.init_db import init_db


BOOKINGS = (
    ("SAL-002", time(8), time(10), 20),
    ("SAL-003", time(9), time(11), 15),
    ("SAL-005", time(10), time(12), 25),
    ("SAL-006", time(13), time(14), 8),
    ("SAL-004", time(14), time(16), 30),
)
INCIDENTS = (
    ("technology", "medium", "it_support", None, "Proyector de demostración sin señal."),
    ("network", "high", "it_support", None, "Conectividad de demostración intermitente."),
    ("cleaning", "low", "cleaning", None, "Limpieza de demostración pendiente."),
    ("electrical", "medium", "maintenance", None, "Luminaria de demostración intermitente."),
    ("safety", "high", "security", "SAL-004", "Sala de demostración inhabilitada para reubicación."),
)


def seed_scenarios(db: Session, demo_date: date, teacher_email: str, support_email: str,
                   resource_ids: tuple[str, ...] = ()) -> dict[str, int]:
    """Add only missing markers in one transaction, rejecting conflicting real operations."""
    if demo_date <= date.today():
        raise ValueError("DEMO_DATE debe ser una fecha futura.")
    if resource_ids and (len(resource_ids) != 3 or len(set(resource_ids)) != 3):
        raise ValueError("DEMO_RESOURCE_IDS requiere tres identificadores distintos.")
    counts = {"reservations": 0, "incidents": 0, "loans": 0}
    marker = f"DEMO-SEED:{demo_date.isoformat()}"
    try:
        teacher = db.scalar(select(User).where(User.email == teacher_email))
        support = db.scalar(select(User).where(User.email == support_email))
        if not teacher or teacher.role != Role.TEACHER.value:
            raise ValueError("TEACHER_EMAIL debe identificar la cuenta demo docente.")
        if not support or support.role != Role.SUPPORT.value:
            raise ValueError("SUPPORT_EMAIL debe identificar la cuenta demo de soporte.")

        for space_id, start, end, attendees in BOOKINGS:
            title = f"{marker}:RES:{space_id}"
            existing = db.scalar(select(Reservation).where(Reservation.title == title))
            if existing:
                if (existing.space_id, existing.user_id, existing.date) != (space_id, teacher.id, demo_date):
                    raise ValueError(f"Marcador de reserva {title} usado por otro registro.")
                continue
            room = db.get(Space, space_id)
            if not room or room.is_blocked or room.capacity < attendees:
                raise ValueError(f"Sala {space_id} ausente, bloqueada o con aforo insuficiente.")
            conflict = db.scalar(select(Reservation.id).where(
                Reservation.space_id == space_id, Reservation.date == demo_date,
                Reservation.status == "confirmed", Reservation.start_time < end,
                Reservation.end_time > start,
            ).limit(1))
            if conflict:
                raise ValueError(f"La sala {space_id} ya tiene una reserva en la franja demo.")
            db.add(Reservation(space_id=space_id, user_id=teacher.id, date=demo_date,
                               start_time=start, end_time=end, attendees=attendees, title=title))
            counts["reservations"] += 1

        for index, (category, priority, team, space_id, description) in enumerate(INCIDENTS, start=1):
            context = f"{marker}:INC:{index}; datos ficticios para demostración"
            existing = db.scalar(select(Incident).where(Incident.context == context))
            if existing:
                continue
            blocking = space_id is not None
            incident = Incident(reporter_id=support.id, space_id=space_id,
                                description=description, context=context, category=category,
                                priority=priority, assigned_team=team,
                                classification_source="rules", is_blocking=blocking,
                                suggests_blocking=blocking)
            incident.events.append(IncidentEvent(actor_id=support.id, event_type="created",
                                                 details="DEMO-SEED: escenario ficticio"))
            db.add(incident)
            if blocking:
                room = db.get(Space, space_id)
                if not room:
                    raise ValueError(f"Sala {space_id} no encontrada.")
                room.is_blocked = True
            counts["incidents"] += 1

        if resource_ids:
            resources = [db.get(Resource, resource_id.upper()) for resource_id in resource_ids]
            if any(resource is None or resource.condition != "operational" or resource.is_blocked
                   for resource in resources):
                raise ValueError("Los tres equipos demo deben existir, estar operativos y habilitados.")
            _available, in_use, returned = resources
            for resource in resources:
                active = db.scalar(select(Loan).where(
                    Loan.resource_id == resource.id, Loan.returned_at.is_(None)).limit(1))
                expected_note = f"{marker}:LOAN:{resource.id}; dato ficticio para demostración"
                if active and (resource != in_use or active.notes != expected_note):
                    raise ValueError("Un equipo demo ya tiene un préstamo activo; no se altera.")
            now = datetime.now(timezone.utc).replace(tzinfo=None)
            for resource, is_returned in ((in_use, False), (returned, True)):
                note = f"{marker}:LOAN:{resource.id}; dato ficticio para demostración"
                if db.scalar(select(Loan.id).where(Loan.notes == note)):
                    continue
                start = now - (timedelta(days=1) if is_returned else timedelta(hours=1))
                db.add(Loan(resource_id=resource.id, borrower_id=teacher.id,
                            start_time=start, expected_return=start + timedelta(hours=4),
                            returned_at=start + timedelta(hours=2) if is_returned else None,
                            notes=note))
                counts["loans"] += 1
            # The first authorized resource remains available by design.
        db.commit()
    except Exception:
        db.rollback()
        raise
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description="Crear escenarios ficticios optativos.")
    parser.add_argument("--date", type=date.fromisoformat, required=True, help="Fecha futura YYYY-MM-DD")
    parser.add_argument("--resource-ids", default="", help="Tres IDs de equipos autorizados, separados por coma")
    args = parser.parse_args()
    ids = tuple(value.strip().upper() for value in args.resource_ids.split(",") if value.strip())
    try:
        init_db()
        with SessionLocal() as db:
            result = seed_scenarios(db, args.date, os.getenv("TEACHER_EMAIL", ""),
                                    os.getenv("SUPPORT_EMAIL", ""), ids)
    except Exception as exc:
        print(f"SEED de escenarios falló: {exc}", file=sys.stderr)
        return 1
    print(f"Escenarios demo listos: {result}.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
