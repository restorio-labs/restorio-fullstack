from fastapi import FastAPI, Request, status
import pytest

from core.exceptions import BaseHTTPException
from core.exceptions.handlers import setup_exception_handlers
from core.foundation.infra.config import Settings


@pytest.mark.asyncio
async def test_restorio_exception_handler_returns_500_and_hides_detail_when_debug_false() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=False)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[BaseHTTPException]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = BaseHTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Test error",
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "An error occurred" in body
    assert "Test error" not in body


@pytest.mark.asyncio
async def test_restorio_exception_handler_returns_500_and_shows_detail_when_debug_true() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=True)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[BaseHTTPException]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = BaseHTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Test error",
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "Test error" in body


@pytest.mark.asyncio
async def test_general_exception_handler_debug_false() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=False)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[Exception]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = RuntimeError("failure")

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "An unexpected error occurred" in body
    assert "type" not in body


@pytest.mark.asyncio
async def test_general_exception_handler_debug_true() -> None:
    app = FastAPI()
    settings = Settings(DEBUG=True)
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[Exception]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = RuntimeError("failure")

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    body = response.body.decode()
    assert "An unexpected error occurred" in body
    assert "RuntimeError" in body
