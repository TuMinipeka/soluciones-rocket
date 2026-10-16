"""HTTP request and response shapes for room reservations."""

from datetime import date as DateType
from datetime import datetime as DateTimeType
from datetime import time as TimeType
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator


class ReservationCreate(BaseModel):
    space_id: str = Field(min_length=7, max_length=7, pattern=r"^SAL-[0-9]{3}$")
    date: DateType
    start_time: TimeType
    end_time: TimeType
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


class ReservationUpdate(BaseModel):
    space_id: str | None = Field(default=None, min_length=7, max_length=7, pattern=r"^SAL-[0-9]{3}$")
    date: DateType | None = None
    start_time: TimeType | None = None
    end_time: TimeType | None = None
    attendees: int | None = Field(default=None, gt=0)
    title: str | None = Field(default=None, min_length=2, max_length=150)

    @field_validator("space_id", mode="before")
    @classmethod
    def normalize_space_id(cls, value: str | None) -> str | None:
        return value.strip().upper() if value is not None else None

    @field_validator("title")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        return value.strip() if value is not None else None

    @model_validator(mode="after")
    def require_changes(self) -> "ReservationUpdate":
        if not self.model_fields_set:
            raise ValueError("Debe enviarse al menos un campo para modificar la reserva.")
        if any(getattr(self, field) is None for field in self.model_fields_set):
            raise ValueError("Los campos modificados no pueden ser nulos.")
        return self


class ReservationEventResponse(BaseModel):
    id: int
    actor_id: int
    event_type: Literal["created", "updated", "cancelled"]
    details: str | None
    created_at: DateTimeType


class ReservationResponse(BaseModel):
    id: int
    space_id: str
    space_name: str
    user_id: int
    date: DateType
    start_time: TimeType
    end_time: TimeType
    attendees: int
    title: str
    status: Literal["confirmed", "cancelled"]
    events: list[ReservationEventResponse]
