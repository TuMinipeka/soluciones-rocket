"""Incident management service implementing domain logic, availability effects, and event logging."""

import json
from datetime import datetime, timezone
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.core.security import verify_analysis_token
from app.modules.auth.enums import Role
from app.modules.auth.models import User
from app.modules.incidents.enums import (
    ClassificationSource,
    IncidentCategory,
    IncidentPriority,
    IncidentStatus,
    ResponsibleTeam,
)
from app.modules.incidents.models import Incident, IncidentEvent
from app.modules.incidents.schemas import (
    IncidentCreateRequest,
    IncidentUpdateRequest,
)
from app.modules.recommendations.classifier_rules import classify_by_rules
from app.services.availability import (
    is_valid_space,
    set_space_status,
)
from app.services.resources import (
    is_valid_resource,
    set_resource_status,
)


# Categorías que pueden generar bloqueo de sala o equipo si la prioridad es crítica o alta
BLOCKING_CATEGORIES = {
    IncidentCategory.SAFETY,
    IncidentCategory.ELECTRICAL,
    IncidentCategory.INFRASTRUCTURE,
}

# Transiciones de estado válidas
VALID_STATUS_TRANSITIONS = {
    IncidentStatus.OPEN: {IncidentStatus.IN_PROGRESS, IncidentStatus.RESOLVED},
    IncidentStatus.IN_PROGRESS: {IncidentStatus.RESOLVED},
    IncidentStatus.RESOLVED: {IncidentStatus.OPEN},  # Solo Admin puede reabrir
}


class IncidentService:
    @staticmethod
    def create_incident(data: IncidentCreateRequest, reporter: User, db: Session) -> Incident:
        """Crea una nueva incidencia con validación de salas/recursos, procedencia verificable y auditoría."""
        # 1. Validar sala si se especifica
        if data.space_id and not is_valid_space(data.space_id):
            raise ValidationError(f"La sala '{data.space_id}' no pertenece al catálogo oficial de salas.")

        # 2. Validar recurso si se especifica
        if data.resource_id and not is_valid_resource(data.resource_id, db):
            raise ValidationError(f"El identificador de recurso '{data.resource_id}' no es válido.")

        # 3. Determinar clasificación (origen seguro)
        classification_source = ClassificationSource.RULES
        suggests_blocking = False
        recommendation = None
        assigned_team = ResponsibleTeam.ADMINISTRATION

        if data.analysis_token:
            token_payload = verify_analysis_token(data.analysis_token, data.description)
            if token_payload is not None:
                # Procedencia criptográfica verificada
                classification_source = ClassificationSource(token_payload.get("source", "rules"))
                category = IncidentCategory(token_payload.get("category", IncidentCategory.OTHER.value))
                priority = IncidentPriority(token_payload.get("priority", IncidentPriority.MEDIUM.value))
                assigned_team = ResponsibleTeam(token_payload.get("responsible_team", ResponsibleTeam.ADMINISTRATION.value))
                suggests_blocking = bool(token_payload.get("suggests_blocking", False))
            else:
                # Token adulterado o no coincidente: fallback a reglas
                rules_res = classify_by_rules(data.description)
                category = rules_res["category"]
                priority = rules_res["priority"]
                assigned_team = rules_res["responsible_team"]
                suggests_blocking = rules_res["suggests_blocking"]
                recommendation = rules_res["recommendation"]
        else:
            rules_res = classify_by_rules(data.description)
            category = rules_res["category"]
            priority = rules_res["priority"]
            assigned_team = rules_res["responsible_team"]
            suggests_blocking = rules_res["suggests_blocking"]
            recommendation = rules_res["recommendation"]

        # Si el usuario mandó explícitamente categoría o prioridad válidas, permitir ajuste humano
        if data.category:
            category = data.category
        if data.priority:
            priority = data.priority

        # 4. Regla de dominio: Efecto sobre disponibilidad
        # Solo personal autorizado (support o admin) puede confirmar el bloqueo de una sala o recurso
        is_blocking = False
        should_block = category in BLOCKING_CATEGORIES and priority in (IncidentPriority.HIGH, IncidentPriority.CRITICAL)

        if should_block:
            suggests_blocking = True
            # Solo si el usuario tiene rol de soporte o admin y confirma el bloqueo
            if reporter.role in (Role.ADMIN.value, Role.SUPPORT.value) and data.confirm_blocking:
                is_blocking = True
                if data.space_id:
                    set_space_status(data.space_id, is_blocked=True, _reason=data.description, _db=db)
                if data.resource_id:
                    set_resource_status(data.resource_id, is_blocked=True, _reason=data.description, _db=db)

        incident = Incident(
            reporter_id=reporter.id,
            space_id=data.space_id,
            resource_id=data.resource_id,
            description=data.description,
            context=data.context,
            category=category.value,
            priority=priority.value,
            status=IncidentStatus.OPEN.value,
            assigned_team=assigned_team.value,
            classification_source=classification_source.value,
            recommendation=recommendation,
            suggests_blocking=suggests_blocking,
            is_blocking=is_blocking,
        )

        db.add(incident)
        db.flush()

        # Registrar evento de auditoría
        event_details = {
            "action": "created",
            "category": category.value,
            "priority": priority.value,
            "source": classification_source.value,
            "is_blocking": is_blocking,
        }
        event = IncidentEvent(
            incident_id=incident.id,
            actor_id=reporter.id,
            event_type="created",
            details=json.dumps(event_details),
        )
        db.add(event)

        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def list_incidents(
        status: IncidentStatus | None,
        priority: IncidentPriority | None,
        category: IncidentCategory | None,
        space_id: str | None,
        resource_id: str | None,
        limit: int,
        offset: int,
        current_user: User,
        db: Session,
    ) -> list[Incident]:
        query = select(Incident).options(selectinload(Incident.events)).order_by(Incident.created_at.desc())

        # Criterio de privacidad por rol: Docente solo ve las propias; Soporte y Admin ven todas
        if current_user.role == Role.TEACHER.value:
            query = query.where(Incident.reporter_id == current_user.id)

        if status:
            query = query.where(Incident.status == status.value)
        if priority:
            query = query.where(Incident.priority == priority.value)
        if category:
            query = query.where(Incident.category == category.value)
        if space_id:
            query = query.where(Incident.space_id == space_id.upper())
        if resource_id:
            query = query.where(Incident.resource_id == resource_id.upper())

        query = query.limit(min(limit, 100)).offset(offset)
        return list(db.scalars(query).all())

    @staticmethod
    def get_incident(incident_id: int, current_user: User, db: Session) -> Incident:
        query = select(Incident).options(selectinload(Incident.events)).where(Incident.id == incident_id)
        incident = db.scalar(query)
        if not incident:
            raise NotFoundError(f"Incidencia con id {incident_id} no encontrada.")

        # Control de acceso por rol
        if current_user.role == Role.TEACHER.value and incident.reporter_id != current_user.id:
            raise ForbiddenError("No tienes permiso para consultar esta incidencia.")

        return incident

    @staticmethod
    def update_incident(
        incident_id: int,
        data: IncidentUpdateRequest,
        actor: User,
        db: Session,
    ) -> Incident:
        """Actualiza estado o prioridad de una incidencia, gestionando transiciones y disponibilidad."""
        incident = IncidentService.get_incident(incident_id, actor, db)
        changes: dict[str, dict] = {}

        # 1. Validar transición de estado
        if data.status and data.status.value != incident.status:
            curr_status = IncidentStatus(incident.status)
            target_status = data.status

            allowed = VALID_STATUS_TRANSITIONS.get(curr_status, set())
            if target_status not in allowed:
                raise ConflictError(
                    f"Transición no permitida de '{curr_status.value}' a '{target_status.value}'."
                )

            # Reabrir incidencia resuelta solo puede hacerlo el Administrador
            if curr_status == IncidentStatus.RESOLVED and target_status == IncidentStatus.OPEN:
                if actor.role != Role.ADMIN.value:
                    raise ForbiddenError("Únicamente un Administrador puede reabrir una incidencia ya resuelta.")

            changes["status"] = {"from": incident.status, "to": target_status.value}
            incident.status = target_status.value

            if target_status == IncidentStatus.RESOLVED:
                incident.resolved_at = datetime.now(timezone.utc)
                # Al resolver, restaurar disponibilidad si no quedan otras incidencias abiertas bloqueando
                if incident.is_blocking:
                    IncidentService._restore_availability_if_clean(incident, actor, db)
                    incident.is_blocking = False
            elif target_status == IncidentStatus.OPEN:
                incident.resolved_at = None

        if data.priority and data.priority.value != incident.priority:
            changes["priority"] = {"from": incident.priority, "to": data.priority.value}
            incident.priority = data.priority.value

        if data.category and data.category.value != incident.category:
            changes["category"] = {"from": incident.category, "to": data.category.value}
            incident.category = data.category.value

        if data.assigned_team and data.assigned_team.value != incident.assigned_team:
            changes["assigned_team"] = {"from": incident.assigned_team, "to": data.assigned_team.value}
            incident.assigned_team = data.assigned_team.value

        if data.is_blocking is not None and data.is_blocking != incident.is_blocking:
            # Solo support/admin pueden cambiar el estado de bloqueo
            if actor.role in (Role.ADMIN.value, Role.SUPPORT.value):
                changes["is_blocking"] = {"from": incident.is_blocking, "to": data.is_blocking}
                incident.is_blocking = data.is_blocking
                if data.is_blocking:
                    if incident.space_id:
                        set_space_status(incident.space_id, is_blocked=True, _reason=incident.description, _db=db)
                    if incident.resource_id:
                        set_resource_status(incident.resource_id, is_blocked=True, _reason=incident.description, _db=db)
                else:
                    IncidentService._restore_availability_if_clean(incident, actor, db)

        if changes:
            event = IncidentEvent(
                incident_id=incident.id,
                actor_id=actor.id,
                event_type="updated",
                details=json.dumps(changes),
            )
            db.add(event)

        db.commit()
        db.refresh(incident)
        return incident

    @staticmethod
    def _restore_availability_if_clean(incident: Incident, actor: User, db: Session) -> None:
        """Restaura la disponibilidad de la sala o equipo si no hay otras incidencias abiertas bloqueándolos."""
        if incident.space_id:
            # Contar otras incidencias abiertas y bloqueantes para la misma sala
            other_blocks = db.scalar(
                select(func.count(Incident.id)).where(
                    Incident.id != incident.id,
                    Incident.space_id == incident.space_id,
                    Incident.is_blocking.is_(True),
                    Incident.status != IncidentStatus.RESOLVED.value,
                )
            )
            if not other_blocks or other_blocks == 0:
                set_space_status(incident.space_id, is_blocked=False, _reason="Incidencia resuelta", _db=db)
                event = IncidentEvent(
                    incident_id=incident.id,
                    actor_id=actor.id,
                    event_type="availability_restored",
                    details=json.dumps({"target": "space", "id": incident.space_id}),
                )
                db.add(event)

        if incident.resource_id:
            other_res_blocks = db.scalar(
                select(func.count(Incident.id)).where(
                    Incident.id != incident.id,
                    Incident.resource_id == incident.resource_id,
                    Incident.is_blocking.is_(True),
                    Incident.status != IncidentStatus.RESOLVED.value,
                )
            )
            if not other_res_blocks or other_res_blocks == 0:
                set_resource_status(incident.resource_id, is_blocked=False, _reason="Incidencia resuelta", _db=db)
                event = IncidentEvent(
                    incident_id=incident.id,
                    actor_id=actor.id,
                    event_type="availability_restored",
                    details=json.dumps({"target": "resource", "id": incident.resource_id}),
                )
                db.add(event)
