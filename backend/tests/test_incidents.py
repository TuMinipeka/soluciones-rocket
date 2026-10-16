"""Tests for HU-14 (Incident Management, State Transitions, and Availability Effects)."""

from app.services.availability import is_space_blocked, set_space_status


def test_create_incident_valid_space_and_event_history(client, teacher_token):
    """HU-14: Docente crea incidencia vinculada a sala Cosmos (SAL-002) y genera evento de auditoría."""
    payload = {
        "description": "El proyector no enciende y el cable HDMI está roto.",
        "context": "Clase de bases de datos.",
        "space_id": "SAL-002",
        "category": "technology",
        "priority": "medium",
    }
    response = client.post("/incidents", json=payload, headers={"Authorization": f"Bearer {teacher_token}"})
    assert response.status_code == 201

    data = response.json()
    assert data["space_id"] == "SAL-002"
    assert data["status"] == "open"
    assert data["category"] == "technology"
    assert data["priority"] == "medium"
    assert data["classification_source"] == "rules"
    assert len(data["events"]) >= 1
    assert data["events"][0]["event_type"] == "created"


def test_create_incident_invalid_space_or_resource_rejected(client, teacher_token):
    """HU-14: Rechaza identificadores inexistentes de salas o recursos (422 ValidationError)."""
    # Sala inexistente
    res1 = client.post(
        "/incidents",
        json={"description": "Falla en sala desconocida", "space_id": "SALA_INVENTADA_999"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert res1.status_code == 422
    assert "no pertenece al catálogo oficial" in res1.json()["error"]["message"]

    # Recurso inválido (< 3 caracteres)
    res2 = client.post(
        "/incidents",
        json={"description": "Falla en equipo desconocido", "resource_id": "X"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert res2.status_code == 422


def test_incident_listing_privacy_by_role(client, teacher_token, admin_token, db_session, teacher_user, teacher_user_two):
    """HU-14: Docente solo ve sus propias incidencias; Admin ve todas."""
    # Crear incidencia para docente 1
    client.post(
        "/incidents",
        json={"description": "El proyector del docente uno no enciende", "space_id": "SAL-002"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )

    # Crear incidencia en DB directamente para docente 2
    from app.modules.incidents.models import Incident
    inc2 = Incident(
        reporter_id=teacher_user_two.id,
        space_id="SAL-003",
        description="Incidencia del docente dos",
        category="technology",
        priority="low",
        status="open",
        assigned_team="it_support",
        classification_source="rules",
        suggests_blocking=False,
        is_blocking=False,
    )
    db_session.add(inc2)
    db_session.commit()

    # Docente 1 consulta
    res_teacher = client.get("/incidents", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res_teacher.status_code == 200
    items_t = res_teacher.json()
    assert all(i["reporter_id"] == teacher_user.id for i in items_t)

    # Admin consulta: debe ver ambas
    res_admin = client.get("/incidents", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    items_a = res_admin.json()
    assert len(items_a) >= 2


def test_incident_status_transitions_and_reopen_permission(client, support_token, admin_token, teacher_token):
    """HU-14: Transiciones estrictas de estado (open -> in_progress -> resolved; reabrir solo admin)."""
    # 1. Crear incidencia
    res_create = client.post(
        "/incidents",
        json={"description": "Cerradura trabada en sala Sputnik", "space_id": "SAL-004", "category": "infrastructure"},
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    inc_id = res_create.json()["id"]

    # 2. Soporte avanza a in_progress
    res_prog = client.patch(
        f"/incidents/{inc_id}",
        json={"status": "in_progress"},
        headers={"Authorization": f"Bearer {support_token}"},
    )
    assert res_prog.status_code == 200
    assert res_prog.json()["status"] == "in_progress"

    # 3. Soporte resuelve incidencia
    res_res = client.post(
        f"/incidents/{inc_id}/resolve",
        headers={"Authorization": f"Bearer {support_token}"},
    )
    assert res_res.status_code == 200
    assert res_res.json()["status"] == "resolved"
    assert res_res.json()["resolved_at"] is not None

    # 4. Soporte intenta reabrir (debe dar 403 Forbidden)
    res_reopen_sup = client.patch(
        f"/incidents/{inc_id}",
        json={"status": "open"},
        headers={"Authorization": f"Bearer {support_token}"},
    )
    assert res_reopen_sup.status_code == 403
    assert "únicamente un administrador" in res_reopen_sup.json()["error"]["message"].lower()

    # 5. Admin reabre exitosamente
    res_reopen_adm = client.patch(
        f"/incidents/{inc_id}",
        json={"status": "open"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_reopen_adm.status_code == 200
    assert res_reopen_adm.json()["status"] == "open"


def test_availability_blocking_and_restoring(client, support_token, teacher_token, db_session):
    """HU-14: Soporte reporta falla crítica con confirm_blocking -> inhabilita sala; al resolver restaura."""
    # Asegurar sala Cosmos desbloqueada al inicio
    set_space_status("SAL-002", is_blocked=False, _reason="test_init", _db=db_session)
    assert not is_space_blocked("SAL-002", db_session)

    # 1. Docente reporta falla eléctrica crítica: suggests_blocking=True pero NO inhabilita sala
    res_teacher = client.post(
        "/incidents",
        json={
            "description": "Fuego y humo saliendo del enchufe en Cosmos",
            "space_id": "SAL-002",
            "category": "safety",
            "priority": "critical",
            "confirm_blocking": True,  # Docente no tiene privilegio para bloquear
        },
        headers={"Authorization": f"Bearer {teacher_token}"},
    )
    assert res_teacher.status_code == 201
    assert res_teacher.json()["suggests_blocking"] is True
    assert res_teacher.json()["is_blocking"] is False
    assert not is_space_blocked("SAL-002", db_session)

    # 2. Soporte reporta y confirma bloqueo: sala queda inhabilitada
    res_support = client.post(
        "/incidents",
        json={
            "description": "Fuga grave de agua inundando sala Cosmos",
            "space_id": "SAL-002",
            "category": "infrastructure",
            "priority": "critical",
            "confirm_blocking": True,
        },
        headers={"Authorization": f"Bearer {support_token}"},
    )
    assert res_support.status_code == 201
    inc_sup_id = res_support.json()["id"]
    assert res_support.json()["is_blocking"] is True
    assert is_space_blocked("SAL-002", db_session)

    # 3. Soporte resuelve la incidencia bloqueante: la sala vuelve a estar disponible
    res_resolve = client.post(
        f"/incidents/{inc_sup_id}/resolve",
        headers={"Authorization": f"Bearer {support_token}"},
    )
    assert res_resolve.status_code == 200
    assert not is_space_blocked("SAL-002", db_session)
