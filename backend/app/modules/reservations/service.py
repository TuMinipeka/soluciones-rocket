"""Transactional business rules for creating and managing room reservations."""

from datetime import date, time

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.reservations.models import Reservation, ReservationEvent
from app.modules.reservations.schemas import (
    ReservationCreate,
    ReservationEventResponse,
    ReservationResponse,
    ReservationUpdate,
)
from app.modules.spaces.models import Space


def _lock_writer(db: Session) -> None:
    """Serialize the availability check and insert across SQLite connections."""
    db.connection().exec_driver_sql("BEGIN IMMEDIATE")


def reservation_response(
    reservation: Reservation,
    db: Session,
) -> ReservationResponse:
    space = db.get(Space, reservation.space_id)
    events = db.scalars(
        select(ReservationEvent)
        .where(ReservationEvent.reservation_id == reservation.id)
        .order_by(ReservationEvent.id)
    ).all()
    return ReservationResponse(
        id=reservation.id,
        space_id=reservation.space_id,
        space_name=space.name,
        user_id=reservation.user_id,
        date=reservation.date,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        attendees=reservation.attendees,
        title=reservation.title,
        status=reservation.status,
        events=[
            ReservationEventResponse(
                id=event.id,
                actor_id=event.actor_id,
                event_type=event.event_type,
                details=event.details,
                created_at=event.created_at,
            )
            for event in events
        ],
    )


def _validate_values(
    space_id: str,
    reservation_date: date,
    start_time: time,
    end_time: time,
    attendees: int,
    db: Session,
    *,
    exclude_reservation_id: int | None = None,
) -> Space:
    if start_time >= end_time:
        raise ValidationError("La hora inicial debe ser anterior a la hora final.")
    space = db.get(Space, space_id)
    if space is None:
        raise NotFoundError("Sala no encontrada en el catálogo autorizado.")
    if space.is_blocked:
        raise ConflictError("La sala está inhabilitada y no admite reservas.")
    if attendees > space.capacity:
        raise ConflictError(
            f"El aforo solicitado ({attendees}) supera la capacidad de la sala ({space.capacity})."
        )

    statement = select(Reservation.id).where(
        Reservation.space_id == space.id,
        Reservation.date == reservation_date,
        Reservation.status == "confirmed",
        Reservation.start_time < end_time,
        Reservation.end_time > start_time,
    )
    if exclude_reservation_id is not None:
        statement = statement.where(Reservation.id != exclude_reservation_id)
    if db.scalar(statement.limit(1)) is not None:
        raise ConflictError("La sala ya tiene una reserva confirmada que se solapa con ese horario.")
    return space


def _authorized_reservation(reservation_id: int, actor: User, db: Session) -> Reservation:
    reservation = db.get(Reservation, reservation_id)
    if reservation is None:
        raise NotFoundError("Reserva no encontrada.")
    if actor.role != Role.ADMIN.value and reservation.user_id != actor.id:
        raise ForbiddenError("Solo el propietario o un administrador puede gestionar esta reserva.")
    return reservation


def create_reservation(
    data: ReservationCreate,
    requester: User,
    db: Session,
) -> ReservationResponse:
    try:
        _lock_writer(db)
        space = _validate_values(
            data.space_id,
            data.date,
            data.start_time,
            data.end_time,
            data.attendees,
            db,
        )
        reservation = Reservation(
            space_id=space.id,
            user_id=requester.id,
            date=data.date,
            start_time=data.start_time,
            end_time=data.end_time,
            attendees=data.attendees,
            title=data.title,
            status="confirmed",
        )
        db.add(reservation)
        db.flush()
        db.add(
            ReservationEvent(
                reservation_id=reservation.id,
                actor_id=requester.id,
                event_type="created",
                details="Reserva confirmada.",
            )
        )
        db.commit()
        db.refresh(reservation)
    except Exception:
        db.rollback()
        raise

    return reservation_response(reservation, db)


def list_reservations(
    actor: User,
    db: Session,
    reservation_date: date | None = None,
    space_id: str | None = None,
    user_id: int | None = None,
    status: str | None = None,
) -> list[ReservationResponse]:
    statement = select(Reservation).order_by(Reservation.id.desc())
    if actor.role != Role.ADMIN.value:
        statement = statement.where(Reservation.user_id == actor.id)
    elif user_id is not None:
        statement = statement.where(Reservation.user_id == user_id)
    if reservation_date is not None:
        statement = statement.where(Reservation.date == reservation_date)
    if space_id is not None:
        statement = statement.where(Reservation.space_id == space_id.strip().upper())
    if status is not None:
        statement = statement.where(Reservation.status == status)
    return [reservation_response(item, db) for item in db.scalars(statement).all()]


def update_reservation(
    reservation_id: int,
    data: ReservationUpdate,
    actor: User,
    db: Session,
) -> ReservationResponse:
    try:
        _lock_writer(db)
        reservation = _authorized_reservation(reservation_id, actor, db)
        if reservation.status == "cancelled":
            raise ConflictError("Una reserva cancelada no puede modificarse.")

        changes = data.model_dump(exclude_unset=True)
        values = {
            "space_id": changes.get("space_id", reservation.space_id),
            "date": changes.get("date", reservation.date),
            "start_time": changes.get("start_time", reservation.start_time),
            "end_time": changes.get("end_time", reservation.end_time),
            "attendees": changes.get("attendees", reservation.attendees),
            "title": changes.get("title", reservation.title),
        }
        _validate_values(
            values["space_id"],
            values["date"],
            values["start_time"],
            values["end_time"],
            values["attendees"],
            db,
            exclude_reservation_id=reservation.id,
        )
        for field, value in values.items():
            setattr(reservation, field, value)
        db.add(
            ReservationEvent(
                reservation_id=reservation.id,
                actor_id=actor.id,
                event_type="updated",
                details=f"Campos modificados: {', '.join(sorted(changes))}.",
            )
        )
        db.commit()
        db.refresh(reservation)
    except Exception:
        db.rollback()
        raise
    return reservation_response(reservation, db)


def cancel_reservation(
    reservation_id: int,
    actor: User,
    db: Session,
) -> ReservationResponse:
    try:
        _lock_writer(db)
        reservation = _authorized_reservation(reservation_id, actor, db)
        if reservation.status == "cancelled":
            raise ConflictError("La reserva ya está cancelada.")
        reservation.status = "cancelled"
        db.add(
            ReservationEvent(
                reservation_id=reservation.id,
                actor_id=actor.id,
                event_type="cancelled",
                details="Reserva cancelada; la franja quedó liberada.",
            )
        )
        db.commit()
        db.refresh(reservation)
    except Exception:
        db.rollback()
        raise
    return reservation_response(reservation, db)
