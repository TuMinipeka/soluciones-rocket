"""Tests for HU-13 (Permissions Policy and User Administration)."""

from app.core.permissions import can_reserve, can_manage_users, can_confirm_relocation
from app.modules.auth.enums import Role


def test_centralized_permissions_policy():
    """HU-13: Verificación de la matriz centralizada ROLE_PERMISSIONS."""
    # Reservas: Admin y Teacher sí, Support NO (403)
    assert can_reserve(Role.ADMIN.value) is True
    assert can_reserve(Role.TEACHER.value) is True
    assert can_reserve(Role.SUPPORT.value) is False

    # Administración de usuarios: Solo Admin
    assert can_manage_users(Role.ADMIN.value) is True
    assert can_manage_users(Role.TEACHER.value) is False
    assert can_manage_users(Role.SUPPORT.value) is False

    # Reubicación: Solo Admin
    assert can_confirm_relocation(Role.ADMIN.value) is True
    assert can_confirm_relocation(Role.TEACHER.value) is False
    assert can_confirm_relocation(Role.SUPPORT.value) is False


def test_list_users_only_admin_authorized(client, admin_token, teacher_token, support_token):
    """HU-13: Solo el administrador puede listar usuarios (Docente y Soporte reciben 403)."""
    # Admin exitoso
    res_admin = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert isinstance(res_admin.json(), list)

    # Docente denegado (403)
    res_teacher = client.get("/users", headers={"Authorization": f"Bearer {teacher_token}"})
    assert res_teacher.status_code == 403

    # Soporte denegado (403)
    res_support = client.get("/users", headers={"Authorization": f"Bearer {support_token}"})
    assert res_support.status_code == 403


def test_admin_update_user_role(client, admin_token, teacher_user):
    """HU-13: Admin puede actualizar el rol de un usuario existente."""
    payload = {"role": "support"}
    res = client.patch(
        f"/users/{teacher_user.id}/role",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["role"] == "support"


def test_user_cannot_change_own_role(client, admin_token, admin_user):
    """HU-13: Un administrador no puede cambiar su propio rol (409 Conflict)."""
    payload = {"role": "teacher"}
    res = client.patch(
        f"/users/{admin_user.id}/role",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 409
    assert "propio rol" in res.json()["error"]["message"].lower()


def test_cannot_downgrade_or_deactivate_last_active_admin(client, admin_token, admin_user):
    """HU-13: Protección del sistema: no se puede degradar ni desactivar al último admin activo."""
    # Intentar degradar
    res_role = client.patch(
        f"/users/{admin_user.id}/role",
        json={"role": "support"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_role.status_code == 409

    # Intentar desactivar
    res_status = client.patch(
        f"/users/{admin_user.id}/status",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_status.status_code == 409


def test_admin_update_user_status(client, admin_token, teacher_user):
    """HU-13: Admin puede desactivar una cuenta de docente."""
    payload = {"is_active": False}
    res = client.patch(
        f"/users/{teacher_user.id}/status",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res.status_code == 200
    assert res.json()["is_active"] is False
