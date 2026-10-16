"""Room reservation creation and management endpoints."""

from datetime import date
from typing import Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.reservations.schemas import (
    RelocationOptionsResponse,
    ReservationCreate,
    ReservationRelocate,
    ReservationResponse,
    ReservationUpdate,
)
from app.modules.reservations.service import (
    cancel_reservation,
    create_reservation,
    get_relocation_options,
    list_affected_reservations,
    list_reservations,
    relocate_reservation,
    update_reservation,
)


router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def reserve_space(
    data: ReservationCreate,
    requester: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    return create_reservation(data, requester, db)


@router.get("", response_model=list[ReservationResponse])
def get_reservations(
    reservation_date: date | None = Query(default=None, alias="date"),
    space_id: str | None = Query(default=None),
    user_id: int | None = Query(default=None, ge=1),
    reservation_status: Literal["confirmed", "cancelled"] | None = Query(default=None, alias="status"),
    actor: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> list[ReservationResponse]:
    return list_reservations(
        actor,
        db,
        reservation_date=reservation_date,
        space_id=space_id,
        user_id=user_id,
        status=reservation_status,
    )


@router.get("/affected", response_model=list[ReservationResponse])
def get_affected_reservations(
    actor: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> list[ReservationResponse]:
    return list_affected_reservations(actor, db)


@router.get("/{reservation_id}/reallocations", response_model=RelocationOptionsResponse)
def get_reallocations(
    reservation_id: int,
    actor: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> RelocationOptionsResponse:
    return get_relocation_options(reservation_id, actor, db)


@router.post("/{reservation_id}/reallocate", response_model=ReservationResponse)
def confirm_reallocation(
    reservation_id: int,
    data: ReservationRelocate,
    actor: User = Depends(require_roles(Role.ADMIN)),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    return relocate_reservation(reservation_id, data, actor, db)


@router.put("/{reservation_id}", response_model=ReservationResponse)
def modify_reservation(
    reservation_id: int,
    data: ReservationUpdate,
    actor: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    return update_reservation(reservation_id, data, actor, db)


@router.delete("/{reservation_id}", response_model=ReservationResponse)
def remove_reservation(
    reservation_id: int,
    actor: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    return cancel_reservation(reservation_id, actor, db)
