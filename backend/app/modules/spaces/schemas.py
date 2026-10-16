"""HTTP response shapes for rooms and their availability."""

from datetime import date, time
from typing import Literal

from pydantic import BaseModel


class SpaceAvailabilityResponse(BaseModel):
    id: str
    name: str
    capacity: int
    status: Literal["available", "occupied", "disabled"]
    is_blocked: bool
    has_conflict: bool


class SpaceReservationSlotResponse(BaseModel):
    id: int
    date: date
    start_time: time
    end_time: time
    status: Literal["confirmed", "cancelled"]
