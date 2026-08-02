import pytest

from main import app, create_application


def test_root_returns_json() -> None:
    root_route = next(route for route in app.routes if getattr(route, "path", None) == "/")

    body = root_route.endpoint()

    assert body["message"] == "Welcome to Restorio API"
    assert "version" in body


def test_create_application_adds_proxy_headers_when_enabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr("main.settings.TRUST_PROXY_HEADERS", True)

    application = create_application()

    assert any(
        middleware.cls.__name__ == "ProxyHeadersMiddleware"
        for middleware in application.user_middleware
    )
