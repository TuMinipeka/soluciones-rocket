"""Room queries and deterministic availability rules backed by SQLite."""

from datetime import date, time

from sqlalchemy import exists, select
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError, ValidationError
from app.modules.reservations.models import Reservation
from app.modules.spaces.models import Space
from app.modules.spaces.schemas import SpaceAvailabilityResponse, SpaceReservationSlotResponse


def _validate_interval(
    requested_date: date | None,
    start_time: time | None,
    end_time: time | None,
) -> bool:
    supplied = (requested_date is not None, start_time is not None, end_time is not None)
    if any(supplied) and not all(supplied):
        raise ValidationError("Fecha, hora inicial y hora final deben enviarse juntas.")
    if all(supplied) and start_time >= end_time:
        raise ValidationError("La hora inicial debe ser anterior a la hora final.")
    return all(supplied)


def _response(space: Space, has_conflict: bool = False) -> SpaceAvailabilityResponse:
    if space.is_blocked:
        status = "disabled"
    elif has_conflict:
        status = "occupied"
    else:
        status = "available"
    return SpaceAvailabilityResponse(
        id=space.id,
        name=space.name,
        capacity=space.capacity,
        status=status,
        is_blocked=space.is_blocked,
        has_conflict=has_conflict,
    )


def list_spaces(
    db: Session,
    requested_date: date | None = None,
    start_time: time | None = None,
    end_time: time | None = None,
) -> list[SpaceAvailabilityResponse]:
    has_interval = _validate_interval(requested_date, start_time, end_time)
    if not has_interval:
        spaces = db.scalars(select(Space).order_by(Space.id)).all()
        return [_response(space) for space in spaces]

    conflict_exists = exists(
        select(Reservation.id).where(
            Reservation.space_id == Space.id,
            Reservation.date == requested_date,
            Reservation.status == "confirmed",
            Reservation.start_time < end_time,
            Reservation.end_time > start_time,
        )
    )
    rows = db.execute(
        select(Space, conflict_exists.label("has_conflict")).order_by(Space.id)
    ).all()
    return [_response(space, bool(has_conflict)) for space, has_conflict in rows]


def get_space(
    space_id: str,
    db: Session,
    requested_date: date | None = None,
    start_time: time | None = None,
    end_time: time | None = None,
) -> SpaceAvailabilityResponse:
    space = db.get(Space, space_id.strip().upper())
    if space is None:
        raise NotFoundError("Sala no encontrada en el catálogo autorizado.")
    has_interval = _validate_interval(requested_date, start_time, end_time)
    if not has_interval:
        return _response(space)
    has_conflict = db.scalar(
        select(
            exists().where(
                Reservation.space_id == space.id,
                Reservation.date == requested_date,
                Reservation.status == "confirmed",
                Reservation.start_time < end_time,
                Reservation.end_time > start_time,
            )
        )
    )
    return _response(space, bool(has_conflict))


def list_space_reservations(
    space_id: str,
    db: Session,
    requested_date: date | None = None,
) -> list[SpaceReservationSlotResponse]:
    normalized_id = space_id.strip().upper()
    if db.get(Space, normalized_id) is None:
        raise NotFoundError("Sala no encontrada en el catálogo autorizado.")
    statement = (
        select(Reservation)
        .where(Reservation.space_id == normalized_id)
        .order_by(Reservation.date, Reservation.start_time, Reservation.id)
    )
    if requested_date is not None:
        statement = statement.where(Reservation.date == requested_date)
    return [
        SpaceReservationSlotResponse(
            id=reservation.id,
            date=reservation.date,
            start_time=reservation.start_time,
            end_time=reservation.end_time,
            status=reservation.status,
        )
        for reservation in db.scalars(statement).all()
    ]
