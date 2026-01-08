from fastapi import FastAPI, Request, status
import pytest

from core.config import Settings
from core.exceptions import BaseHTTPException
from core.exceptions.handlers import setup_exception_handlers


@pytest.mark.asyncio
async def test_restorio_exception_handler() -> None:
    app = FastAPI()
    settings = Settings()
    setup_exception_handlers(app, settings)

    handler = app.exception_handlers[BaseHTTPException]

    request = Request({"type": "http", "method": "GET", "path": "/", "headers": []})
    exc = BaseHTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        message="Test error",
        error_code="TEST_ERROR",
    )

    response = await handler(request, exc)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    body = response.body.decode()
    assert "TEST_ERROR" in body
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
    assert "INTERNAL_ERROR" in body
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
    assert "INTERNAL_ERROR" in body
    assert "RuntimeError" in body
