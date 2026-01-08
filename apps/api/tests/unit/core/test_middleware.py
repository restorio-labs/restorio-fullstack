from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import pytest

from core.config import Settings
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

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_unauthorized_middleware_passes_other_status() -> None:
    async def call_next(_: Request) -> Response:
        return Response(status_code=200)

    middleware = UnauthorizedMiddleware(call_next)
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    request = Request(scope)

    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 200
