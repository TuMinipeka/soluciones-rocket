"""Service for incident analysis with AI provider, local fallback, and real alternative recommendations."""

import time
from sqlalchemy.orm import Session

from app.core.security import create_analysis_token
from app.modules.incidents.enums import (
    ClassificationSource,
    FallbackReason,
    IncidentCategory,
    IncidentPriority,
    ResponsibleTeam,
)
from app.modules.incidents.schemas import AlternativeItem, IncidentAnalysisResponse
from app.modules.recommendations.ai.provider import (
    AIProvider,
    ChatCompletionsAIProvider,
)
from app.modules.recommendations.classifier_rules import classify_by_rules
from app.services.availability import (
    get_space_alternatives,
    is_valid_space,
    match_space_by_text,
)
from app.services.resources import (
    get_resource_alternatives,
    is_valid_resource,
)


class RecommendationService:
    def __init__(self, ai_provider: AIProvider | None = None):
        self.ai_provider = ai_provider or ChatCompletionsAIProvider()

    async def analyze_incident(
        self,
        description: str,
        context: str | None,
        space_id: str | None,
        resource_id: str | None,
        db: Session,
    ) -> IncidentAnalysisResponse:
        warnings: list[str] = []

        # 1. Validación y detección de sala
        detected_space_id = space_id
        if detected_space_id:
            if not is_valid_space(detected_space_id):
                warnings.append(
                    f"La sala indicada '{detected_space_id}' no pertenece al catálogo oficial de salas y fue descartada."
                )
                detected_space_id = None
        else:
            # Detección determinista por mención en el texto
            detected_space_id = match_space_by_text(description)

        # 2. Validación de recurso tecnológico
        detected_resource_id = resource_id
        if detected_resource_id and not is_valid_resource(detected_resource_id):
            warnings.append(
                f"El identificador de recurso '{detected_resource_id}' no cumple con el formato válido y fue descartado."
            )
            detected_resource_id = None

        # 3. Intentar clasificación con IA
        start_time = time.perf_counter()
        ai_result, ai_model, latency_ms, fallback_reason = await self.ai_provider.classify(
            description=description,
            context=context,
        )

        if ai_result is not None:
            # Éxito con IA real
            classification_source = ClassificationSource.AI
            category = ai_result.category
            priority = ai_result.priority
            responsible_team = ai_result.responsible_team
            recommendation = ai_result.recommendation
            explanation = ai_result.explanation
            suggests_blocking = ai_result.suggests_blocking
        else:
            # Fallback honesto hacia clasificador de reglas locales
            classification_source = ClassificationSource.RULES
            rules_result = classify_by_rules(description)
            category = rules_result["category"]
            priority = rules_result["priority"]
            responsible_team = rules_result["responsible_team"]
            recommendation = rules_result["recommendation"]
            explanation = rules_result["explanation"]
            suggests_blocking = rules_result["suggests_blocking"]
            ai_model = None
            if latency_ms == 0:
                latency_ms = int((time.perf_counter() - start_time) * 1000)

        # 4. Búsqueda de alternativas sobre datos reales (nunca inventar datos)
        alternatives: list[AlternativeItem] = []
        if detected_space_id and (suggests_blocking or priority in (IncidentPriority.HIGH, IncidentPriority.CRITICAL)):
            space_alts = get_space_alternatives(detected_space_id, db)
            for alt in space_alts:
                alternatives.append(AlternativeItem(**alt))
            if not alternatives:
                warnings.append("No se encontraron salas alternativas disponibles con aforo compatible.")

        if detected_resource_id and (suggests_blocking or priority in (IncidentPriority.HIGH, IncidentPriority.CRITICAL)):
            res_alts = get_resource_alternatives(detected_resource_id, db)
            for alt in res_alts:
                alternatives.append(AlternativeItem(**alt))
            if not res_alts:
                warnings.append("No hay equipos de reemplazo disponibles en el inventario oficial.")

        # 5. Generar token firmado de procedencia verificable
        token = create_analysis_token(
            source=classification_source.value,
            category=category.value,
            priority=priority.value,
            responsible_team=responsible_team.value,
            suggests_blocking=suggests_blocking,
            description=description,
        )

        return IncidentAnalysisResponse(
            classification_source=classification_source,
            category=category,
            priority=priority,
            responsible_team=responsible_team,
            recommendation=recommendation,
            explanation=explanation,
            suggests_blocking=suggests_blocking,
            space_id=detected_space_id,
            resource_id=detected_resource_id,
            alternatives=alternatives,
            warnings=warnings,
            ai_model=ai_model,
            fallback_reason=fallback_reason,
            latency_ms=latency_ms,
            analysis_token=token,
        )
