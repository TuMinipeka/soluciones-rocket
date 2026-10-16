"""Security audit tests verifying zero secret leaks in responses or exceptions."""

from app.core.config import settings


def test_zero_secrets_in_login_responses(client, teacher_user):
    """Auditoría de seguridad: Asegurar que password_hash nunca figure en las respuestas."""
    res = client.post("/auth/login", json={"email": teacher_user.email, "password": "TeacherPassword123"})
    text_content = res.text
    assert "password_hash" not in text_content
    assert "$argon2id$" not in text_content
    assert settings.JWT_SECRET_KEY not in text_content
    assert (settings.AI_API_KEY or "") not in text_content


def test_zero_secrets_in_error_responses(client):
    """Auditoría de seguridad: Errores no exponen stack traces ni credenciales internas."""
    res = client.post("/auth/login", json={"email": "hacker@test.com", "password": "Wrong"})
    assert res.status_code == 401
    assert "Traceback" not in res.text
    assert settings.JWT_SECRET_KEY not in res.text
