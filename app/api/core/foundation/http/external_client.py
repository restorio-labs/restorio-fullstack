from __future__ import annotations

from typing import Any

import httpx

from core.exceptions import ExternalAPIError, ServiceUnavailableError


async def external_post_json(
    url: str,
    *,
    json: dict[str, Any],
    headers: dict[str, str] | None = None,
    timeout: float = 30.0,
    service_name: str = "External API",
) -> dict[str, Any]:
    """POST JSON to an external API. Returns parsed JSON on success.
    Raises ExternalAPIError on 4xx/5xx, ServiceUnavailableError on connection/timeout.
    """
    merged_headers = {"Content-Type": "application/json", **(headers or {})}
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                json=json,
                headers=merged_headers,
                timeout=timeout,
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_message = _extract_error_message(e)
            raise ExternalAPIError(
                status_code=e.response.status_code,
                message=f"{service_name} error: {error_message}",
            ) from e
        except httpx.RequestError as e:
            raise ServiceUnavailableError(
                message=f"Failed to connect to {service_name}: {e!s}",
            ) from e


def _extract_error_message(e: httpx.HTTPStatusError) -> str:
    try:
        body = e.response.json()
        if isinstance(body, dict):
            inner = body.get("error") or body.get("errors") or body
            if isinstance(inner, dict) and "message" in inner:
                return str(inner["message"])
            if isinstance(inner, str):
                return inner
        return e.response.text or str(e)
    except Exception:
        return e.response.text or str(e)
