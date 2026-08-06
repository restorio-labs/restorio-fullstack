from collections.abc import Callable
from time import perf_counter
import uuid

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from core.foundation.logging.logger import (
    bind_request_context,
    logger,
    reset_request_context,
    update_request_context,
)

_MAX_REQUEST_IDENTIFIER_LENGTH = 128


def _request_identifier(value: str | None) -> str:
    if (
        value
        and len(value) <= _MAX_REQUEST_IDENTIFIER_LENGTH
        and all(char.isalnum() or char in "-_.:" for char in value)
    ):
        return value
    return str(uuid.uuid4())


def _route_template(request: Request) -> str:
    route = request.scope.get("route")
    return getattr(route, "path", request.url.path)


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = _request_identifier(request.headers.get("X-Request-ID"))
        trace_id = (
            _request_identifier(request.headers.get("X-Trace-ID"))
            if request.headers.get("X-Trace-ID")
            else None
        )
        request.state.request_id = request_id
        request.state.trace_id = trace_id
        context_token = bind_request_context(request_id=request_id, trace_id=trace_id)

        start_time = perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = round((perf_counter() - start_time) * 1000, 3)
            update_request_context(route=_route_template(request))
            logger.info(
                "request_failed",
                extra={
                    "duration_ms": duration_ms,
                    "http_method": request.method,
                },
            )
            raise
        else:
            duration_ms = round((perf_counter() - start_time) * 1000, 3)
            route = _route_template(request)
            update_request_context(route=route)
            logger.info(
                "request_completed",
                extra={
                    "duration_ms": duration_ms,
                    "http_method": request.method,
                    "http_status": response.status_code,
                },
            )

            response.headers["X-Process-Time"] = str(duration_ms / 1000)
            response.headers["X-Request-ID"] = request_id
            if trace_id:
                response.headers["X-Trace-ID"] = trace_id
            return response
        finally:
            reset_request_context(context_token)
