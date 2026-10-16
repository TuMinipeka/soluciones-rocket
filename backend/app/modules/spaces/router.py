"""Room catalogue and availability endpoints."""

from datetime import date, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.spaces import service
from app.modules.spaces.schemas import SpaceAvailabilityResponse, SpaceReservationSlotResponse


router = APIRouter(prefix="/spaces", tags=["spaces"])


@router.get("", response_model=list[SpaceAvailabilityResponse])
def list_spaces(
    requested_date: date | None = Query(default=None, alias="date"),
    start_time: time | None = Query(default=None),
    end_time: time | None = Query(default=None),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SpaceAvailabilityResponse]:
    return service.list_spaces(db, requested_date, start_time, end_time)


@router.get("/{space_id}", response_model=SpaceAvailabilityResponse)
def get_space(
    space_id: str,
    requested_date: date | None = Query(default=None, alias="date"),
    start_time: time | None = Query(default=None),
    end_time: time | None = Query(default=None),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SpaceAvailabilityResponse:
    return service.get_space(space_id, db, requested_date, start_time, end_time)


@router.get("/{space_id}/reservations", response_model=list[SpaceReservationSlotResponse])
def list_space_reservations(
    space_id: str,
    requested_date: date | None = Query(default=None, alias="date"),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SpaceReservationSlotResponse]:
    return service.list_space_reservations(space_id, db, requested_date)
