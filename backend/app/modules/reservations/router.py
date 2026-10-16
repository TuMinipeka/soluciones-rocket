"""Room reservation endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.permissions import require_roles
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.reservations.schemas import ReservationCreate, ReservationResponse
from app.modules.reservations.service import create_reservation


router = APIRouter(prefix="/reservations", tags=["reservations"])


@router.post("", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def reserve_space(
    data: ReservationCreate,
    requester: User = Depends(require_roles(Role.ADMIN, Role.TEACHER)),
    db: Session = Depends(get_db),
) -> ReservationResponse:
    return create_reservation(data, requester, db)
