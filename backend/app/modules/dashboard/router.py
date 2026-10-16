"""Live operational indicators derived from persisted campus records."""

from datetime import date, time

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.incidents.models import Incident
from app.modules.resources.models import Loan, Resource
from app.modules.spaces.service import list_spaces


router = APIRouter(prefix="/dashboard", tags=["dashboard"])


class DashboardSummary(BaseModel):
    available_spaces: int
    occupied_spaces: int
    disabled_spaces: int
    active_loans: int
    disabled_resources: int
    open_incidents: int
    in_progress_incidents: int


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    requested_date: date | None = Query(default=None, alias="date"),
    start_time: time | None = Query(default=None),
    end_time: time | None = Query(default=None),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummary:
    """Count current records; room occupancy uses the same interval rules as GET /spaces."""
    spaces = list_spaces(db, requested_date, start_time, end_time)
    return DashboardSummary(
        available_spaces=sum(space.status == "available" for space in spaces),
        occupied_spaces=sum(space.status == "occupied" for space in spaces),
        disabled_spaces=sum(space.status == "disabled" for space in spaces),
        active_loans=db.scalar(select(func.count(Loan.id)).where(Loan.returned_at.is_(None))) or 0,
        disabled_resources=db.scalar(
            select(func.count(Resource.id)).where(
                or_(Resource.is_blocked.is_(True), Resource.condition != "operational")
            )
        ) or 0,
        open_incidents=db.scalar(select(func.count(Incident.id)).where(Incident.status == "open")) or 0,
        in_progress_incidents=db.scalar(
            select(func.count(Incident.id)).where(Incident.status == "in_progress")
        ) or 0,
    )
