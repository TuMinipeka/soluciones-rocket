"""Punto de integración con el módulo de espacios y reservas de Conde.

Este archivo define la interfaz acordada para verificar salas oficiales, consultar
alternativas de reubicación y actualizar el estado de disponibilidad cuando una
incidencia crítica bloquea o libera un espacio.
"""

import unicodedata
from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.modules.reservations.models import Reservation
from app.modules.spaces.models import Space


# Catálogo oficial de las 10 salas del campus (Fuente: docs/hackaton-rubricas-informacion.md)
OFFICIAL_SPACES = {
    "SAL-001": {"name": "Auditorio", "capacity": 100},
    "SAL-002": {"name": "Cosmos", "capacity": 25},
    "SAL-003": {"name": "Skylab", "capacity": 20},
    "SAL-004": {"name": "Sputnik", "capacity": 38},
    "SAL-005": {"name": "Apolo", "capacity": 34},
    "SAL-006": {"name": "Sala Nueva", "capacity": 12},
    "SAL-007": {"name": "Azul", "capacity": 10},
    "SAL-008": {"name": "Amarillas", "capacity": 6},
    "SAL-009": {"name": "Verdes", "capacity": 6},
    "SAL-010": {"name": "Artemis", "capacity": 32},
}

LEGACY_SPACE_NAMES = {
    "SAL-003": "Skilab",
    "SAL-004": "Spooki",
    "SAL-006": "Blanca",
}

def strip_accents(text: str) -> str:
    """Normaliza texto eliminando acentos y diacríticos."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def is_valid_space(space_id: str | None) -> bool:
    """Verifica si el identificador corresponde a una de las salas oficiales."""
    if not space_id:
        return False
    return space_id.upper() in OFFICIAL_SPACES


def get_space_info(space_id: str) -> dict | None:
    return OFFICIAL_SPACES.get(space_id.upper())


def match_space_by_text(text: str) -> str | None:
    """Encuentra determinísticamente si una sala oficial es mencionada por nombre en el texto."""
    norm_text = strip_accents(text)
    for sid, info in OFFICIAL_SPACES.items():
        norm_name = strip_accents(info["name"])
        if norm_name in norm_text.split() or f"sala {norm_name}" in norm_text or norm_name in norm_text:
            return sid
    return None


def set_space_status(space_id: str, is_blocked: bool, _reason: str, _db: Session) -> bool:
    """Stage a room block in the caller's transaction."""
    sid = space_id.upper()
    space = _db.get(Space, sid)
    if space is None:
        return False
    space.is_blocked = is_blocked
    _db.flush()
    return True


def is_space_blocked(space_id: str, db: Session) -> bool:
    space = db.get(Space, space_id.upper())
    return bool(space and space.is_blocked)


def get_space_alternatives(space_id: str, _db: Session) -> list[dict]:
    """Punto de integración que consulta alternativas deterministas para una sala inhabilitada.
    
    Busca salas no bloqueadas con aforo similar (dentro de un rango de capacidad razonable).
    No inventa salas: utiliza exclusivamente las salas oficiales de Campuslands.
    """
    sid = space_id.upper()
    current_space = OFFICIAL_SPACES.get(sid)
    if not current_space:
        return []

    target_capacity = current_space["capacity"]
    alternatives = []

    # Ordenar salas disponibles por cercanía de aforo
    for other_id, other_info in OFFICIAL_SPACES.items():
        if other_id == sid:
            continue
        if is_space_blocked(other_id, _db):
            continue

        cap = other_info["capacity"]
        # Considerar compatible si el aforo es al menos 80% del actual o puede albergar un grupo similar
        if cap >= target_capacity * 0.8:
            alternatives.append({
                "kind": "space",
                "id": other_id,
                "name": other_info["name"],
                "reason": f"Aforo compatible ({cap} personas vs {target_capacity} requeridas) y sala operativa.",
                "capacity_diff": abs(cap - target_capacity),
            })

    # Ordenar por menor diferencia de aforo para mejor aprovechamiento
    alternatives.sort(key=lambda x: x["capacity_diff"])
    for item in alternatives:
        del item["capacity_diff"]

    return alternatives[:3]


def find_relocation_alternatives(reservation: Reservation, db: Session) -> list[dict]:
    """Return real compatible rooms for one reservation, ordered deterministically."""
    overlap = exists(
        select(Reservation.id).where(
            Reservation.space_id == Space.id,
            Reservation.id != reservation.id,
            Reservation.date == reservation.date,
            Reservation.status == "confirmed",
            Reservation.start_time < reservation.end_time,
            Reservation.end_time > reservation.start_time,
        )
    )
    candidates = db.scalars(
        select(Space)
        .where(
            Space.id != reservation.space_id,
            Space.is_blocked.is_(False),
            Space.capacity >= reservation.attendees,
            ~overlap,
        )
        .order_by((Space.capacity - reservation.attendees), Space.id)
    ).all()
    return [
        {
            "id": space.id,
            "name": space.name,
            "capacity": space.capacity,
            "reason": (
                f"Sala operativa, sin conflictos y con aforo suficiente "
                f"({space.capacity} para {reservation.attendees} asistentes)."
            ),
        }
        for space in candidates
    ]


def recommend_spaces_for_request(
    attendees: int,
    reservation_date,
    start_time,
    end_time,
    db: Session,
) -> list[dict]:
    """Recommend spaces from the DB: enough capacity, not blocked and free in the slot.

    Capacity comes from the database, never from hardcoded values. A recommendation
    is NOT a confirmed reservation.
    """
    statement = select(Space).where(
        Space.is_blocked.is_(False),
        Space.capacity >= attendees,
    )
    if reservation_date and start_time and end_time:
        overlap = exists(
            select(Reservation.id).where(
                Reservation.space_id == Space.id,
                Reservation.date == reservation_date,
                Reservation.status == "confirmed",
                Reservation.start_time < end_time,
                Reservation.end_time > start_time,
            )
        )
        statement = statement.where(~overlap)
    spaces = db.scalars(statement.order_by(Space.capacity - attendees, Space.id)).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "capacity": s.capacity,
            "reason": f"Aforo suficiente ({s.capacity} para {attendees} asistentes), sala operativa y libre en el horario.",
        }
        for s in spaces
    ]
