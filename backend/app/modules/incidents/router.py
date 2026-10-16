"""Incidents and AI Analysis HTTP Router."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.permissions import get_current_user, require_roles
from app.db.session import get_db
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.incidents.enums import (
    IncidentCategory,
    IncidentPriority,
    IncidentStatus,
)
from app.modules.incidents.schemas import (
    IncidentAnalysisRequest,
    IncidentAnalysisResponse,
    IncidentCreateRequest,
    IncidentResponse,
    IncidentUpdateRequest,
)
from app.modules.incidents.service import IncidentService
from app.modules.recommendations.service import RecommendationService


router = APIRouter(prefix="/incidents", tags=["incidents"])
recommendation_service = RecommendationService()


@router.post(
    "/analyze",
    response_model=IncidentAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Análisis y triaje inteligente de incidencia (HU-15 y HU-16)",
    description="Clasifica la falla con IA o fallback local determinista, consulta alternativas reales y emite token criptográfico firmado.",
)
async def analyze_incident(
    data: IncidentAnalysisRequest,
    _current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IncidentAnalysisResponse:
    return await recommendation_service.analyze_incident(
        description=data.description,
        context=data.context,
        space_id=data.space_id,
        resource_id=data.resource_id,
        db=db,
    )


@router.post(
    "",
    response_model=IncidentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una nueva incidencia (HU-14)",
    description="Crea la incidencia con procedencia verificable, valida referencias a salas/recursos y registra evento de auditoría.",
)
def create_incident(
    data: IncidentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IncidentResponse:
    incident = IncidentService.create_incident(data, current_user, db)
    return IncidentResponse.model_validate(incident)


@router.get(
    "",
    response_model=list[IncidentResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar incidencias del campus (HU-14)",
    description="Docentes consultan únicamente sus propios reportes; Soporte y Administradores visualizan todas las incidencias.",
)
def list_incidents(
    status: IncidentStatus | None = Query(default=None),
    priority: IncidentPriority | None = Query(default=None),
    category: IncidentCategory | None = Query(default=None),
    space_id: str | None = Query(default=None),
    resource_id: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[IncidentResponse]:
    incidents = IncidentService.list_incidents(
        status=status,
        priority=priority,
        category=category,
        space_id=space_id,
        resource_id=resource_id,
        limit=limit,
        offset=offset,
        current_user=current_user,
        db=db,
    )
    return [IncidentResponse.model_validate(inc) for inc in incidents]


@router.get(
    "/{id}",
    response_model=IncidentResponse,
    status_code=status.HTTP_200_OK,
    summary="Consultar detalle e historial de una incidencia (HU-14)",
    description="Devuelve la información de la incidencia con su trazabilidad completa de eventos de auditoría.",
)
def get_incident(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> IncidentResponse:
    incident = IncidentService.get_incident(id, current_user, db)
    return IncidentResponse.model_validate(incident)


@router.patch(
    "/{id}",
    response_model=IncidentResponse,
    status_code=status.HTTP_200_OK,
    summary="Actualizar estado o prioridad de una incidencia (HU-14)",
    description="Permitido solo para Soporte y Administrador. Aplica transiciones estrictas de estado y gestiona disponibilidad.",
)
def update_incident(
    id: int,
    data: IncidentUpdateRequest,
    current_user: User = Depends(require_roles(Role.SUPPORT, Role.ADMIN)),
    db: Session = Depends(get_db),
) -> IncidentResponse:
    updated = IncidentService.update_incident(id, data, current_user, db)
    return IncidentResponse.model_validate(updated)


@router.post(
    "/{id}/resolve",
    response_model=IncidentResponse,
    status_code=status.HTTP_200_OK,
    summary="Resolver una incidencia (HU-14)",
    description="Marca la incidencia como resuelta, registra fecha de resolución y restaura disponibilidad si no hay otros bloqueos.",
)
def resolve_incident(
    id: int,
    current_user: User = Depends(require_roles(Role.SUPPORT, Role.ADMIN)),
    db: Session = Depends(get_db),
) -> IncidentResponse:
    updated = IncidentService.update_incident(
        id,
        IncidentUpdateRequest(status=IncidentStatus.RESOLVED),
        current_user,
        db,
    )
    return IncidentResponse.model_validate(updated)
