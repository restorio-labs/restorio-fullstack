from fastapi.testclient import TestClient

from main import app


def test_root_returns_json() -> None:
    client = TestClient(app)
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["message"] == "Welcome to Restorio API"
    assert "version" in body
