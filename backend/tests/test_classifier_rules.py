"""Tests for HU-16 (Local Deterministic Rules Classifier and Explainability)."""

from app.modules.incidents.enums import (
    IncidentCategory,
    IncidentPriority,
    ResponsibleTeam,
)
from app.modules.recommendations.classifier_rules import classify_by_rules


def test_classifier_rules_technology():
    """HU-16: Palabras como proyector o pantalla activan categoría technology y soporte TI."""
    res = classify_by_rules("El proyector no prende y la pantalla no da video.")
    assert res["category"] == IncidentCategory.TECHNOLOGY
    assert res["responsible_team"] == ResponsibleTeam.IT_SUPPORT
    assert "proyector" in res["matched_keywords"] or "pantalla" in res["matched_keywords"]
    assert "Regla activada por palabras clave" in res["explanation"]


def test_classifier_rules_network():
    """HU-16: Palabras como wifi o internet activan categoría network."""
    res = classify_by_rules("No hay conexion a internet ni senal de wifi.")
    assert res["category"] == IncidentCategory.NETWORK
    assert res["responsible_team"] == ResponsibleTeam.IT_SUPPORT


def test_classifier_rules_critical_safety_override():
    """HU-16: Fuego, humo o chispa elevan automáticamente la prioridad a CRITICAL y sugieren bloqueo."""
    res = classify_by_rules("Hay humo y fuego saliendo del tablero de control.")
    assert res["category"] == IncidentCategory.SAFETY
    assert res["priority"] == IncidentPriority.CRITICAL
    assert res["suggests_blocking"] is True
    assert res["responsible_team"] == ResponsibleTeam.SECURITY


def test_classifier_rules_cleaning():
    """HU-16: Derrame y basura activan categoría cleaning y equipo de aseo."""
    res = classify_by_rules("Hay un derrame de cafe y mucha basura en el piso.")
    assert res["category"] == IncidentCategory.CLEANING
    assert res["responsible_team"] == ResponsibleTeam.CLEANING
    assert res["priority"] == IncidentPriority.LOW


def test_classifier_rules_fallback_when_no_match():
    """HU-16: Texto sin palabras clave técnicas cae en OTHER y administración."""
    res = classify_by_rules("Necesito información sobre el calendario general de eventos.")
    assert res["category"] == IncidentCategory.OTHER
    assert res["responsible_team"] == ResponsibleTeam.ADMINISTRATION
    assert res["suggests_blocking"] is False
    assert res["priority"] == IncidentPriority.LOW


def test_classifier_does_not_match_partial_words_in_absurd_story():
    res = classify_by_rules("En la sala del auditorio explotó un volcán y todos se murieron.")
    assert res["category"] == IncidentCategory.OTHER
    assert res["matched_keywords"] == []
