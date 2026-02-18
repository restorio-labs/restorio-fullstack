from unittest.mock import patch

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import pytest

from core.foundation.infra.config import Settings
from core.middleware import TimingMiddleware, UnauthorizedMiddleware, setup_cors


def test_setup_cors_adds_middleware() -> None:
    app = FastAPI()
    settings = Settings(CORS_ORIGINS=["http://example.com"])

    setup_cors(app=app, settings=settings)

    assert any(isinstance(m.cls, type) and m.cls is CORSMiddleware for m in app.user_middleware)


@pytest.mark.asyncio
async def test_timing_middleware_adds_header() -> None:
    async def call_next(_: Request) -> Response:
        return Response(content="ok")

    middleware = TimingMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert "X-Process-Time" in response.headers


@pytest.mark.asyncio
async def test_unauthorized_middleware_transforms_not_found() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=404)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 401  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_passes_other_status() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"authorization", b"Bearer valid-token")],
    }
    request = Request(scope)

    with patch.object(middleware._security, "decode_access_token", return_value={"sub": "user-1"}):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_allows_public_routes() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=204)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/docs", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 204  # noqa: PLR2004


@pytest.mark.asyncio
async def test_unauthorized_middleware_returns_401_on_invalid_token() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {
        "type": "http",
        "method": "GET",
        "path": "/",
        "headers": [(b"authorization", b"Bearer invalid-token")],
    }
    request = Request(scope)

    with patch.object(
        middleware._security, "decode_access_token", side_effect=Exception("bad token")
    ):
        response = await middleware.dispatch(request, call_next)

    assert response.status_code == 401  # noqa: PLR2004
