"""Pydantic v2 schemas for incidents and incident analysis."""

import re
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.incidents.enums import (
    ClassificationSource,
    FallbackReason,
    IncidentCategory,
    IncidentPriority,
    IncidentStatus,
    ResponsibleTeam,
)


CONTROL_CHARS_PATTERN = re.compile(r"[\x00-\x1f\x7f-\x9f]")


def sanitize_text(text: str) -> str:
    """Elimina caracteres de control y normaliza espacios repetidos."""
    cleaned = CONTROL_CHARS_PATTERN.sub("", text)
    return " ".join(cleaned.strip().split())


class AlternativeItem(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "kind": "space",
                "id": "SAL-003",
                "name": "Skilab",
                "reason": "Aforo compatible (20 personas) y disponible en la franja horaria requerida",
            }
        }
    )

    kind: str = Field(..., description="Tipo de alternativa ('space' o 'resource')")
    id: str | int = Field(..., description="Identificador único del recurso o espacio alternativo")
    name: str = Field(..., description="Nombre descriptivo de la alternativa")
    reason: str = Field(..., description="Justificación técnica de la compatibilidad")


class IncidentAnalysisRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "description": "El proyector de la sala Cosmos parpadea y huele a quemado.",
                "context": "Clase magistral de programación en curso.",
                "space_id": "SAL-002",
                "resource_id": None,
            }
        }
    )

    description: str = Field(..., min_length=10, max_length=2000, description="Descripción detallada de la falla")
    context: str | None = Field(None, max_length=500, description="Contexto operativo adicional")
    space_id: str | None = Field(None, max_length=50, description="Identificador de la sala afectada")
    resource_id: str | None = Field(None, max_length=50, description="Identificador del equipo tecnológico afectado")

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        clean = sanitize_text(value)
        if len(clean) < 10:
            raise ValueError("La descripción debe tener al menos 10 caracteres significativos.")
        return clean

    @field_validator("context")
    @classmethod
    def validate_context(cls, value: str | None) -> str | None:
        if value is None:
            return None
        clean = sanitize_text(value)
        return clean or None


class IncidentAnalysisResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "classification_source": "ai",
                "category": "electrical",
                "priority": "critical",
                "responsible_team": "maintenance",
                "recommendation": "Desconectar interruptor principal y evacuar sala temporalmente.",
                "explanation": "Olor a quemado y chispas indican riesgo eléctrico crítico.",
                "suggests_blocking": True,
                "space_id": "SAL-002",
                "resource_id": None,
                "alternatives": [
                    {
                        "kind": "space",
                        "id": "SAL-003",
                        "name": "Skilab",
                        "reason": "Aforo compatible (20 personas) y disponible sin conflictos.",
                    }
                ],
                "warnings": [],
                "ai_model": "gpt-4o-mini",
                "fallback_reason": None,
                "latency_ms": 280,
                "analysis_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            }
        }
    )

    classification_source: ClassificationSource
    category: IncidentCategory
    priority: IncidentPriority
    responsible_team: ResponsibleTeam
    recommendation: str
    explanation: str
    suggests_blocking: bool
    space_id: str | None = None
    resource_id: str | None = None
    alternatives: list[AlternativeItem] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    ai_model: str | None = None
    fallback_reason: FallbackReason | None = None
    latency_ms: int = 0
    analysis_token: str


class IncidentCreateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "description": "El aire acondicionado de la sala Apolo gotea profusamente.",
                "context": "Temperatura elevada en el aula.",
                "space_id": "SAL-005",
                "resource_id": None,
                "category": "infrastructure",
                "priority": "medium",
                "analysis_token": None,
                "confirm_blocking": False,
            }
        }
    )

    description: str = Field(..., min_length=10, max_length=2000)
    context: str | None = Field(None, max_length=500)
    space_id: str | None = Field(None, max_length=50)
    resource_id: str | None = Field(None, max_length=50)
    category: IncidentCategory | None = None
    priority: IncidentPriority | None = None
    analysis_token: str | None = None
    confirm_blocking: bool = False

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        clean = sanitize_text(value)
        if len(clean) < 10:
            raise ValueError("La descripción debe tener al menos 10 caracteres significativos.")
        return clean


class IncidentUpdateRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "in_progress",
                "priority": "high",
                "category": "infrastructure",
                "assigned_team": "maintenance",
                "is_blocking": False,
            }
        }
    )

    status: IncidentStatus | None = None
    priority: IncidentPriority | None = None
    category: IncidentCategory | None = None
    assigned_team: ResponsibleTeam | None = None
    is_blocking: bool | None = None


class IncidentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    incident_id: int
    actor_id: int | None
    event_type: str
    details: str | None
    created_at: datetime


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    reporter_id: int
    space_id: str | None
    resource_id: str | None
    description: str
    context: str | None
    category: IncidentCategory
    priority: IncidentPriority
    status: IncidentStatus
    assigned_team: ResponsibleTeam
    classification_source: ClassificationSource
    recommendation: str | None
    suggests_blocking: bool
    is_blocking: bool
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None
    events: list[IncidentEventResponse] = Field(default_factory=list)
