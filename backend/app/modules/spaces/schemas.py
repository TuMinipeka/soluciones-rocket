"""HTTP response shapes for rooms and their availability."""

from typing import Literal

from pydantic import BaseModel


class SpaceAvailabilityResponse(BaseModel):
    id: str
    name: str
    capacity: int
    status: Literal["available", "occupied", "disabled"]
    is_blocked: bool
    has_conflict: bool
