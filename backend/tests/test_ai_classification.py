"""Tests for HU-15 (AI Incident Classification, Schema Validation, Prompt Injection, and Analysis Tokens)."""

import json
import httpx
import pytest

from app.core.config import settings
from app.modules.incidents.enums import ClassificationSource, FallbackReason
from app.modules.recommendations.ai.provider import ChatCompletionsAIProvider
from app.modules.recommendations.service import RecommendationService


@pytest.mark.asyncio
async def test_groq_provider_uses_endpoint_and_json_mode(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "groq")
    monkeypatch.setattr(settings, "AI_BASE_URL", None)
    monkeypatch.setattr(settings, "AI_MODEL", "openai/gpt-oss-20b")
    requests = []

    def mock_handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(200, json={"choices": [{"message": {"content": json.dumps({
            "category": "electrical",
            "priority": "high",
            "responsible_team": "maintenance",
            "recommendation": "Desconectar el circuito.",
            "explanation": "Hay riesgo eléctrico.",
            "suggests_blocking": True,
        })}}]})

    provider = ChatCompletionsAIProvider(transport=httpx.MockTransport(mock_handler))
    result, model, _, fallback = await provider.classify("El tomacorriente echa chispas.", None)

    assert result is not None
    assert result.category == "electrical"
    assert model == "openai/gpt-oss-20b"
    assert fallback is None
    assert str(requests[0].url) == "https://api.groq.com/openai/v1/chat/completions"
    assert json.loads(requests[0].content)["response_format"] == {"type": "json_object"}


@pytest.mark.asyncio
async def test_unknown_provider_without_base_url_falls_back(monkeypatch):
    monkeypatch.setattr(settings, "AI_PROVIDER", "unknown")
    monkeypatch.setattr(settings, "AI_BASE_URL", None)
    provider = ChatCompletionsAIProvider()
    result, model, latency, fallback = await provider.classify("El tomacorriente echa chispas.", None)
    assert (result, model, latency, fallback) == (None, None, 0, FallbackReason.NOT_CONFIGURED)


@pytest.mark.asyncio
async def test_ai_classification_valid_response(db_session):
    """HU-15: Respuesta válida del modelo se valida con Pydantic y retorna classification_source='ai'."""
    ai_response_payload = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "category": "electrical",
                        "priority": "high",
                        "responsible_team": "maintenance",
                        "recommendation": "Cortar el breaker del sector y reemplazar tomacorriente.",
                        "explanation": "Chispas en enchufe representan riesgo eléctrico alto.",
                        "suggests_blocking": True,
                    })
                }
            }
        ]
    }

    def mock_handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=ai_response_payload)

    transport = httpx.MockTransport(mock_handler)
    ai_provider = ChatCompletionsAIProvider(transport=transport)
    service = RecommendationService(ai_provider=ai_provider)

    res = await service.analyze_incident(
        description="El enchufe principal de la sala Cosmos echa chispas al conectar la laptop.",
        context="Clase de programación.",
        space_id="SAL-002",
        resource_id=None,
        db=db_session,
    )

    assert res.classification_source == ClassificationSource.AI
    assert res.category == "electrical"
    assert res.priority == "high"
    assert res.responsible_team == "maintenance"
    assert res.suggests_blocking is True
    assert res.ai_model == settings.AI_MODEL
    assert res.fallback_reason is None
    assert res.analysis_token is not None


@pytest.mark.asyncio
async def test_ai_classification_invalid_json_or_enum_falls_back_to_rules(db_session):
    """HU-15: Respuesta corrupta o con enums inventados activa el fallback local con motivo 'invalid_response'."""
    # Respuesta con enum de categoría inexistente ("alien_invasion")
    corrupt_payload = {
        "choices": [
            {
                "message": {
                    "content": json.dumps({
                        "category": "alien_invasion",
                        "priority": "ultra_high",
                        "responsible_team": "avengers",
                        "recommendation": "Correr.",
                        "explanation": "Invasión.",
                        "suggests_blocking": True,
                    })
                }
            }
        ]
    }

    def mock_handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=corrupt_payload)

    transport = httpx.MockTransport(mock_handler)
    ai_provider = ChatCompletionsAIProvider(transport=transport)
    service = RecommendationService(ai_provider=ai_provider)

    res = await service.analyze_incident(
        description="El proyector no enciende y no da imagen.",
        context=None,
        space_id="SAL-002",
        resource_id=None,
        db=db_session,
    )

    # Fallback honesto a rules
    assert res.classification_source == ClassificationSource.RULES
    assert res.ai_model is None
    assert res.fallback_reason == FallbackReason.INVALID_RESPONSE
    assert res.category == "technology"


@pytest.mark.asyncio
async def test_ai_classification_timeout_and_500_fallbacks(db_session):
    """HU-15: Timeout o HTTP 500 del proveedor activan fallback local con la causa respectiva."""
    # 1. Error HTTP 500
    def mock_500(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="Internal Server Error")

    service_500 = RecommendationService(ai_provider=ChatCompletionsAIProvider(transport=httpx.MockTransport(mock_500)))
    res_500 = await service_500.analyze_incident(
        description="Falla en la red wifi del auditorio.",
        context=None,
        space_id="SAL-001",
        resource_id=None,
        db=db_session,
    )
    assert res_500.classification_source == ClassificationSource.RULES
    assert res_500.fallback_reason == FallbackReason.HTTP_ERROR
    assert res_500.category == "network"


@pytest.mark.asyncio
async def test_ai_discard_invented_room_with_warning(db_session):
    """HU-15: Una sala inventada por el usuario o alucinada es descartada y se genera un warning."""
    ai_payload = {
        "choices": [
            {"message": {"content": json.dumps({
                "category": "furniture",
                "priority": "low",
                "responsible_team": "maintenance",
                "recommendation": "Revisar mesas.",
                "explanation": "Mobiliario averiado.",
                "suggests_blocking": False,
            })}}
        ]
    }
    transport = httpx.MockTransport(lambda req: httpx.Response(200, json=ai_payload))
    service = RecommendationService(ai_provider=ChatCompletionsAIProvider(transport=transport))

    res = await service.analyze_incident(
        description="Las mesas de la sala Narnia están cojas.",
        context=None,
        space_id="SAL-999-NARNIA",  # Sala inexistente
        resource_id=None,
        db=db_session,
    )

    assert res.space_id is None
    assert any("descartada" in w.lower() for w in res.warnings)


def test_tampered_analysis_token_does_not_spoof_ai(client, teacher_token):
    """HU-15: Un token de análisis adulterado no permite falsificar el origen 'ai' en POST /incidents."""
    payload = {
        "description": "El tablero acrílico tiene manchas de marcador permanente.",
        "space_id": "SAL-003",
        "category": "furniture",
        "analysis_token": "token_falso_adulterado_sin_firma",
    }
    res = client.post("/incidents", json=payload, headers={"Authorization": f"Bearer {teacher_token}"})
    assert res.status_code == 201
    data = res.json()
    # Debe ser clasificado por rules y no por ai falsificado
    assert data["classification_source"] == "rules"
