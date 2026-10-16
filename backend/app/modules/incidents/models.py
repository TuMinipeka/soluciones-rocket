"""SQLAlchemy models for Incidents and Incident Events."""

from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.modules.incidents.enums import (
    ClassificationSource,
    IncidentCategory,
    IncidentPriority,
    IncidentStatus,
    ResponsibleTeam,
)


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    reporter_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True, nullable=False)
    space_id: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)
    resource_id: Mapped[str | None] = mapped_column(String(50), index=True, nullable=True)

    description: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str] = mapped_column(String(50), default=IncidentCategory.OTHER.value, nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default=IncidentPriority.MEDIUM.value, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default=IncidentStatus.OPEN.value, index=True, nullable=False)
    assigned_team: Mapped[str] = mapped_column(String(50), default=ResponsibleTeam.ADMINISTRATION.value, nullable=False)

    classification_source: Mapped[str] = mapped_column(
        String(20), default=ClassificationSource.RULES.value, nullable=False
    )
    recommendation: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggests_blocking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_blocking: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    events: Mapped[list["IncidentEvent"]] = relationship(
        "IncidentEvent",
        back_populates="incident",
        cascade="all, delete-orphan",
        order_by="IncidentEvent.created_at",
    )


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    incident_id: Mapped[int] = mapped_column(
        ForeignKey("incidents.id", ondelete="CASCADE"), index=True, nullable=False
    )
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    incident: Mapped["Incident"] = relationship("Incident", back_populates="events")
