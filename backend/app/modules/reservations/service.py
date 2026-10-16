"""Transactional business rules for creating room reservations."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.modules.auth.models import User
from app.modules.reservations.models import Reservation
from app.modules.reservations.schemas import ReservationCreate, ReservationResponse
from app.modules.spaces.models import Space


def _lock_writer(db: Session) -> None:
    """Serialize the availability check and insert across SQLite connections."""
    db.connection().exec_driver_sql("BEGIN IMMEDIATE")


def reservation_response(
    reservation: Reservation,
    space_name: str,
) -> ReservationResponse:
    return ReservationResponse(
        id=reservation.id,
        space_id=reservation.space_id,
        space_name=space_name,
        user_id=reservation.user_id,
        date=reservation.date,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        attendees=reservation.attendees,
        title=reservation.title,
        status=reservation.status,
    )


def create_reservation(
    data: ReservationCreate,
    requester: User,
    db: Session,
) -> ReservationResponse:
    if data.start_time >= data.end_time:
        raise ValidationError("La hora inicial debe ser anterior a la hora final.")

    try:
        _lock_writer(db)
        space = db.get(Space, data.space_id)
        if space is None:
            raise NotFoundError("Sala no encontrada en el catálogo autorizado.")
        if space.is_blocked:
            raise ConflictError("La sala está inhabilitada y no admite reservas.")
        if data.attendees > space.capacity:
            raise ConflictError(
                f"El aforo solicitado ({data.attendees}) supera la capacidad de la sala ({space.capacity})."
            )

        overlap = db.scalar(
            select(Reservation.id)
            .where(
                Reservation.space_id == space.id,
                Reservation.date == data.date,
                Reservation.status == "confirmed",
                Reservation.start_time < data.end_time,
                Reservation.end_time > data.start_time,
            )
            .limit(1)
        )
        if overlap is not None:
            raise ConflictError("La sala ya tiene una reserva confirmada que se solapa con ese horario.")

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
        db.commit()
        db.refresh(reservation)
    except Exception:
        db.rollback()
        raise

    return reservation_response(reservation, space.name)
