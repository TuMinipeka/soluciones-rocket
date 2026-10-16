"""HTTP request and response shapes for room reservations."""

from datetime import date, time
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class ReservationCreate(BaseModel):
    space_id: str = Field(min_length=7, max_length=7, pattern=r"^SAL-[0-9]{3}$")
    date: date
    start_time: time
    end_time: time
    attendees: int = Field(gt=0)
    title: str = Field(min_length=2, max_length=150)

    @field_validator("space_id", mode="before")
    @classmethod
    def normalize_space_id(cls, value: str) -> str:
        return value.strip().upper()

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str) -> str:
        return value.strip()


class ReservationResponse(BaseModel):
    id: int
    space_id: str
    space_name: str
    user_id: int
    date: date
    start_time: time
    end_time: time
    attendees: int
    title: str
    status: Literal["confirmed", "cancelled"]
