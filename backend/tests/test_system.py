"""Acceptance tests for the FastAPI foundation described by HU-01."""


def test_health_returns_service_status(client):
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_documents_health_endpoint(client):
    response = client.get("/openapi.json")

    assert response.status_code == 200
    document = response.json()
    assert document["info"]["title"] == "Campuslands Operations API"
    assert "/health" in document["paths"]
    assert "get" in document["paths"]["/health"]


def test_swagger_ui_is_available(client):
    response = client.get("/docs")

    assert response.status_code == 200
    assert "swagger-ui" in response.text.lower()


def test_unknown_route_uses_consistent_error_contract(client):
    response = client.get("/route-that-does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "error": {
            "code": "NOT_FOUND",
            "message": "Not Found",
            "details": None,
        }
    }


def test_validation_error_uses_consistent_error_contract(client):
    response = client.post("/auth/register", json={})

    assert response.status_code == 422
    payload = response.json()
    assert payload["error"]["code"] == "VALIDATION_ERROR"
    assert payload["error"]["details"][0]["field"] == "body -> name"
