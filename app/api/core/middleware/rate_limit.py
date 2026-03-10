from __future__ import annotations

from collections import defaultdict
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from starlette.types import ASGIApp

from core.foundation.infra.config import settings
from core.foundation.logging.audit import audit
from core.foundation.logging.logger import logger


@dataclass(frozen=True)
class _RateRule:
    max_requests: int
    window_seconds: int


_RATE_LIMITED_PATHS: dict[str, _RateRule] = {
    f"{settings.API_V1_PREFIX}/auth/login": _RateRule(max_requests=10, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/refresh": _RateRule(max_requests=20, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/register": _RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/activate": _RateRule(max_requests=10, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/set-password": _RateRule(max_requests=5, window_seconds=60),
    f"{settings.API_V1_PREFIX}/auth/resend-activation": _RateRule(
        max_requests=3, window_seconds=60
    ),
}


def _match_rule(path: str) -> _RateRule | None:
    for prefix, rule in _RATE_LIMITED_PATHS.items():
        if path == prefix or path.startswith((prefix + "/", prefix + "?")):
            return rule
    return None


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@dataclass
class _BucketEntry:
    timestamps: list[float] = field(default_factory=list)


class _InMemoryBackend:
    def __init__(self) -> None:
        self._buckets: dict[str, _BucketEntry] = defaultdict(_BucketEntry)

    def is_rate_limited(self, key: str, rule: _RateRule) -> tuple[bool, int]:
        now = time.monotonic()
        cutoff = now - rule.window_seconds
        entry = self._buckets[key]
        entry.timestamps = [ts for ts in entry.timestamps if ts > cutoff]

        if len(entry.timestamps) >= rule.max_requests:
            return True, rule.max_requests

        entry.timestamps.append(now)
        remaining = rule.max_requests - len(entry.timestamps)
        return False, remaining


_backend = _InMemoryBackend()


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        if request.method == "OPTIONS":
            return await call_next(request)

        rule = _match_rule(request.url.path)
        if rule is None:
            return await call_next(request)

        ip = _client_ip(request)
        key = f"rl:{request.url.path}:{ip}"

        limited, remaining = _backend.is_rate_limited(key, rule)

        if limited:
            logger.warning(
                "Rate limit exceeded: path=%s ip=%s",
                request.url.path,
                ip,
            )
            audit.rate_limited(request=request)
            return JSONResponse(
                status_code=429,
                content={"message": "Too many requests. Please try again later."},
                headers={
                    "Retry-After": str(rule.window_seconds),
                    "X-RateLimit-Limit": str(rule.max_requests),
                    "X-RateLimit-Remaining": "0",
                },
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(rule.max_requests)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        return response
