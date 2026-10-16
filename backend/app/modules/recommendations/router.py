"""Stateless space recommendation endpoint (a recommendation is not a reservation)."""

from datetime import date, time

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, model_validator
from sqlalchemy.orm import Session

from app.core.exceptions import ValidationError
from app.core.permissions import get_current_user
from app.db.session import get_db
from app.modules.auth.models import User
from app.modules.reservations.service import CAMPUS_CLOSE_TIME, CAMPUS_OPEN_TIME
from app.services.availability import recommend_spaces_for_request

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


class SpaceRecommendationRequest(BaseModel):
    attendees: int = Field(gt=0)
    date: date
    start_time: time
    end_time: time

    @model_validator(mode="after")
    def _check_interval(self):
        if self.start_time >= self.end_time:
            raise ValueError("La hora inicial debe ser anterior a la hora final.")
        return self


class SpaceRecommendationItem(BaseModel):
    id: str
    name: str
    capacity: int
    reason: str


class SpaceRecommendationResponse(BaseModel):
    confirmed: bool = False
    source: str = "database_rules"
    recommendations: list[SpaceRecommendationItem]


@router.post("/spaces", response_model=SpaceRecommendationResponse)
def recommend_spaces(
    data: SpaceRecommendationRequest,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SpaceRecommendationResponse:
    if data.start_time < CAMPUS_OPEN_TIME or data.end_time > CAMPUS_CLOSE_TIME:
        raise ValidationError("El horario debe estar entre las 06:00 y las 22:00.")
    items = recommend_spaces_for_request(
        data.attendees, data.date, data.start_time, data.end_time, db
    )
    return SpaceRecommendationResponse(recommendations=items)
