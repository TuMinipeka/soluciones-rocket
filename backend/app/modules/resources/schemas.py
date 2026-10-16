"""HTTP shapes for authorized inventory and loan operations."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ResourceCreate(BaseModel):
    id: str = Field(min_length=3, max_length=50, pattern=r"^[A-Za-z0-9][A-Za-z0-9-]*$")
    name: str = Field(min_length=2, max_length=100)
    category: str = Field(min_length=2, max_length=50)

    @field_validator("id")
    @classmethod
    def normalize_id(cls, value: str) -> str:
        return value.upper()


class ResourceConditionUpdate(BaseModel):
    condition: Literal["operational", "damaged"]


class ResourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    condition: str
    status: Literal["available", "loaned", "disabled"]
    is_blocked: bool


class LoanCreate(BaseModel):
    resource_id: str = Field(min_length=3, max_length=50)
    start_time: datetime
    expected_return: datetime
    notes: str | None = Field(default=None, max_length=1000)

    @field_validator("resource_id")
    @classmethod
    def normalize_resource_id(cls, value: str) -> str:
        return value.strip().upper()


class LoanResponse(BaseModel):
    id: int
    resource_id: str
    resource_name: str
    user_id: int
    start_time: datetime
    expected_return: datetime
    returned_at: datetime | None
    status: Literal["active", "returned"]
    notes: str | None
