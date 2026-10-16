"""Inventory hooks consumed by Diego's incident and recommendation services."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.resources.models import Loan, Resource


def is_valid_resource(resource_id: str | None, db: Session) -> bool:
    return bool(resource_id and db.get(Resource, resource_id.upper()) is not None)


def set_resource_status(resource_id: str, is_blocked: bool, _reason: str, _db: Session) -> bool:
    """Stage a block in the caller's transaction; the incident service commits it."""
    resource = _db.get(Resource, resource_id.upper())
    if resource is None:
        return False
    resource.is_blocked = is_blocked
    _db.flush()
    return True


def is_resource_blocked(resource_id: str, db: Session) -> bool:
    resource = db.get(Resource, resource_id.upper())
    return bool(resource and resource.is_blocked)


def get_resource_alternatives(resource_id: str, db: Session) -> list[dict]:
    """Suggest only registered, operational, unblocked equipment in the same category."""
    original = db.get(Resource, resource_id.upper())
    if original is None:
        return []

    candidates = db.scalars(
        select(Resource)
        .where(
            Resource.id != original.id,
            Resource.category == original.category,
            Resource.condition == "operational",
            Resource.is_blocked.is_(False),
        )
        .order_by(Resource.id)
    ).all()
    alternatives = []
    for item in candidates:
        active_loan = db.scalar(
            select(Loan.id).where(Loan.resource_id == item.id, Loan.returned_at.is_(None)).limit(1)
        )
        if active_loan is None:
            alternatives.append({
                "kind": "resource",
                "id": item.id,
                "name": item.name,
                "reason": "Equipo autorizado de la misma categoría, operativo y sin préstamo activo.",
            })
    return alternatives[:3]
