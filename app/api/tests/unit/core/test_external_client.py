from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from core.exceptions import ExternalAPIError, ServiceUnavailableError
from services.external_client_service import ExternalClient


@pytest.mark.asyncio
async def test_external_post_json_success_returns_json() -> None:
    mock_response = MagicMock()
    mock_response.raise_for_status = MagicMock()
    mock_response.json.return_value = {"token": "abc123", "status": "ok"}

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        result = await ExternalClient().external_post_json(
            "https://api.example.com/register",
            json={"key": "value"},
            headers={"Authorization": "Bearer x"},
            timeout=10.0,
            service_name="Example API",
        )

        assert result == {"token": "abc123", "status": "ok"}
        mock_post.assert_called_once_with(
            "https://api.example.com/register",
            json={"key": "value"},
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer x",
            },
            timeout=10.0,
        )


@pytest.mark.asyncio
async def test_external_post_json_http_status_error_raises_external_api_error() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": {"message": "Invalid request"}}
    mock_response.text = "Bad Request"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Bad Request",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == 500
        assert "Example API error" in exc_info.value.detail
        assert "Invalid request" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_request_error_raises_service_unavailable() -> None:
    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ServiceUnavailableError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == 500
        assert "Failed to connect to Example API" in exc_info.value.detail
        assert "Connection refused" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_from_body_errors_key() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 422
    mock_response.json.return_value = {"errors": "Validation failed"}
    mock_response.text = "Unprocessable Entity"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Unprocessable",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json("https://api.example.com", json={})

        assert "Validation failed" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_fallback_to_response_text() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 500
    mock_response.json.side_effect = ValueError("not json")
    mock_response.text = "Internal Server Error"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Server Error",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json("https://api.example.com", json={})

        assert exc_info.value.status_code == 500
        assert "Internal Server Error" in exc_info.value.detail


@pytest.mark.asyncio
async def test_external_post_json_extract_error_fallback_inside_try_block() -> None:
    mock_response = MagicMock()
    mock_response.status_code = 418
    # JSON is valid but not dict → triggers fallback inside try block
    mock_response.json.return_value = ["unexpected", "format"]
    mock_response.text = "I'm a teapot"

    with patch("services.external_client_service.httpx.AsyncClient") as mock_client_cls:
        mock_post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Teapot Error",
                request=MagicMock(),
                response=mock_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(ExternalAPIError) as exc_info:
            await ExternalClient().external_post_json(
                "https://api.example.com/endpoint",
                json={},
                service_name="Example API",
            )

        assert exc_info.value.status_code == 500
        assert "I'm a teapot" in exc_info.value.detail
