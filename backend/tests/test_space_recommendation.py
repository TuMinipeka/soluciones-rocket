"""Room recommendations use real available spaces and disclose AI fallback."""

import pytest
from datetime import date, time

from app.modules.incidents.enums import FallbackReason
from app.modules.spaces.recommendation import SpaceRecommendationRequest, recommend_space
from app.modules.spaces.models import Space
from app.modules.reservations.models import Reservation
from app.modules.recommendations.ai.provider import ChatCompletionsAIProvider


class FakeAI:
    def __init__(self, result=None, fallback=None):
        self.result = result
        self.fallback = fallback

    async def complete_json(self, *_args):
        return self.result, "test-model" if self.result else None, 12, self.fallback


@pytest.mark.asyncio
async def test_ai_recommendation_only_uses_available_persisted_rooms(db_session):
    db_session.get(Space, "SAL-001").is_blocked = True
    db_session.commit()
    data = SpaceRecommendationRequest(attendees=30, activityTitle="Taller de programación")
    result = await recommend_space(data, db_session, FakeAI({
        "is_relevant": True,
        "recommended_id": "SAL-005",
        "alternative_ids": ["SAL-004", "SAL-010"],
        "reason": "Aforo adecuado para el taller.",
    }))
    assert result.classification_source == "ai"
    assert result.recommended_space.id == "SAL-005"
    assert {item.id for item in result.alternatives} == {"SAL-004", "SAL-010"}
    assert "SAL-001" not in {item.id for item in result.alternatives}


@pytest.mark.asyncio
async def test_ai_cannot_invent_or_choose_blocked_room(db_session):
    db_session.get(Space, "SAL-001").is_blocked = True
    db_session.commit()
    data = SpaceRecommendationRequest(attendees=30, activityTitle="Taller de programación")
    result = await recommend_space(data, db_session, FakeAI({
        "is_relevant": True,
        "recommended_id": "SAL-001",
        "alternative_ids": [],
        "reason": "Inventé esta sala.",
    }))
    assert result.classification_source == "rules"
    assert result.fallback_reason == FallbackReason.INVALID_RESPONSE
    assert result.ai_model is None
    assert result.recommended_space.id != "SAL-001"


@pytest.mark.asyncio
async def test_ai_cannot_choose_room_occupied_in_requested_slot(db_session, teacher_user):
    db_session.add(Reservation(
        space_id="SAL-005", user_id=teacher_user.id, date=date(2026, 10, 20),
        start_time=time(8), end_time=time(10), attendees=20,
        title="Reserva existente", status="confirmed",
    ))
    db_session.commit()
    data = SpaceRecommendationRequest(
        attendees=30, activityTitle="Taller de programación",
        date="2026-10-20", startTime="08:30", endTime="09:30",
    )
    result = await recommend_space(data, db_session, FakeAI({
        "is_relevant": True, "recommended_id": "SAL-005",
        "alternative_ids": [], "reason": "Sala ocupada",
    }))
    assert result.classification_source == "rules"
    assert result.recommended_space.id != "SAL-005"


@pytest.mark.asyncio
async def test_irrelevant_reservation_request_has_no_room(db_session):
    data = SpaceRecommendationRequest(attendees=10, activityTitle="Un volcán apareció en el auditorio")
    result = await recommend_space(data, db_session, FakeAI({
        "is_relevant": False,
        "recommended_id": None,
        "alternative_ids": [],
        "reason": "No describe una actividad reservable.",
    }))
    assert result.classification_source == "ai"
    assert result.is_relevant is False
    assert result.recommended_space is None


@pytest.mark.asyncio
async def test_room_fallback_does_not_claim_ai_or_inventory(db_session):
    data = SpaceRecommendationRequest(
        attendees=18, activityTitle="Clase de diseño", requiredFeatures=["Estaciones iMac"]
    )
    result = await recommend_space(data, db_session, FakeAI(None, FallbackReason.TIMEOUT))
    assert result.classification_source == "rules"
    assert result.ai_model is None
    assert result.fallback_reason == FallbackReason.TIMEOUT
    assert result.recommended_space.features == []
    assert any("no está verificado" in warning for warning in result.warnings)


def test_room_recommendation_requires_login(client):
    response = client.post("/spaces/recommend", json={"attendees": 10, "activityTitle": "Clase de matemáticas"})
    assert response.status_code == 401


def test_room_recommendation_endpoint_returns_real_ai_source(client, teacher_token, monkeypatch):
    async def fake_complete_json(self, *_args):
        return {
            "is_relevant": True,
            "recommended_id": "SAL-003",
            "alternative_ids": ["SAL-002"],
            "reason": "Aforo suficiente para la actividad.",
        }, "test-model", 15, None

    monkeypatch.setattr(ChatCompletionsAIProvider, "complete_json", fake_complete_json)
    response = client.post(
        "/spaces/recommend",
        json={"attendees": 18, "activityTitle": "Taller de diseño"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["classification_source"] == "ai"
    assert data["ai_model"] == "test-model"
    assert data["recommended_space"]["id"] == "SAL-003"
