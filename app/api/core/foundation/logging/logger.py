"""JSON logging configuration for the API."""

from __future__ import annotations

from collections.abc import Mapping
from contextvars import ContextVar, Token
from datetime import UTC, datetime
import json
import logging
import re
import sys
import traceback
from typing import Any

from core.foundation.infra.config import settings

_REQUEST_CONTEXT: ContextVar[dict[str, str | None] | None] = ContextVar(
    "request_context", default=None
)
_SAFE_EXTRA_FIELDS = frozenset(
    {
        "action",
        "allowed",
        "duration_ms",
        "event",
        "http_method",
        "http_status",
        "policy_id",
        "reason",
        "request_id",
        "route",
        "tenant_id",
        "trace_id",
        "user_id",
    }
)
_SENSITIVE_KEY_PARTS = frozenset(
    {
        "address",
        "authorization",
        "card",
        "cookie",
        "credential",
        "email",
        "ip",
        "password",
        "payload",
        "phone",
        "secret",
        "token",
        "user_agent",
    }
)
_SENSITIVE_VALUE_PATTERN = re.compile(
    r"(?ix)\b("
    r"authorization|cookie|password|passwd|secret|token|api[_-]?key|credential"
    r")\b\s*[:=]\s*(?:bearer\s+)?[^\s,;]+"
)
_BEARER_TOKEN_PATTERN = re.compile(r"(?i)\bbearer\s+[a-z0-9._~+/=-]+")
_REDACTED = "[REDACTED]"


def bind_request_context(
    *,
    request_id: str,
    trace_id: str | None,
    route: str | None = None,
) -> Token[dict[str, str | None]]:
    return _REQUEST_CONTEXT.set(
        {
            "request_id": request_id,
            "trace_id": trace_id,
            "route": route,
        }
    )


def update_request_context(*, route: str | None = None) -> None:
    context = (_REQUEST_CONTEXT.get() or {}).copy()
    if route is not None:
        context["route"] = route
    _REQUEST_CONTEXT.set(context)


def reset_request_context(token: Token[dict[str, str | None]]) -> None:
    _REQUEST_CONTEXT.reset(token)


def redact(value: Any) -> Any:
    if isinstance(value, Mapping):
        return {
            str(key): _REDACTED if _is_sensitive_key(str(key)) else redact(item)
            for key, item in value.items()
        }
    if isinstance(value, list | tuple | set | frozenset):
        return [redact(item) for item in value]
    if isinstance(value, str):
        return _redact_text(value)
    return value


def _is_sensitive_key(key: str) -> bool:
    normalized = key.lower().replace("-", "_")
    return any(part in normalized for part in _SENSITIVE_KEY_PARTS)


def _redact_text(value: str) -> str:
    value = _SENSITIVE_VALUE_PATTERN.sub(lambda match: f"{match.group(1)}={_REDACTED}", value)
    return _BEARER_TOKEN_PATTERN.sub(f"Bearer {_REDACTED}", value)


def _timestamp() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


class JsonLogFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        try:
            payload: dict[str, Any] = {
                "timestamp": _timestamp(),
                "level": record.levelname,
                "service": settings.LOG_SERVICE_NAME,
                "environment": settings.ENV,
                "version": settings.VERSION,
                "git_sha": settings.GIT_SHA,
                "message": _redact_text(record.getMessage()),
            }
            payload.update(
                {
                    key: value
                    for key, value in (_REQUEST_CONTEXT.get() or {}).items()
                    if value is not None
                }
            )
            payload.update(self._safe_extras(record))

            if record.exc_info:
                payload["exception"] = {
                    "type": record.exc_info[0].__name__ if record.exc_info[0] else "Exception",
                    "message": _redact_text(str(record.exc_info[1])),
                    "stacktrace": _redact_text(
                        "".join(traceback.format_exception(*record.exc_info))
                    ),
                }

            return json.dumps(payload, default=str, separators=(",", ":"), sort_keys=True)
        except Exception:
            return json.dumps(
                {
                    "timestamp": _timestamp(),
                    "level": "ERROR",
                    "service": settings.LOG_SERVICE_NAME,
                    "environment": settings.ENV,
                    "version": settings.VERSION,
                    "git_sha": settings.GIT_SHA,
                    "message": "Unable to format log record",
                },
                separators=(",", ":"),
                sort_keys=True,
            )

    @staticmethod
    def _safe_extras(record: logging.LogRecord) -> dict[str, Any]:
        return {
            key: redact(value)
            for key, value in record.__dict__.items()
            if key in _SAFE_EXTRA_FIELDS and value is not None
        }


class SafeStreamHandler(logging.StreamHandler):
    def handleError(self, _record: logging.LogRecord) -> None:  # noqa: N802
        return None


def configure_logging() -> None:
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)

    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    handler = SafeStreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    handler.setFormatter(JsonLogFormatter())
    root_logger.addHandler(handler)
    logging.raiseExceptions = False


def setup_logger(name: str = "restorio") -> logging.Logger:
    configure_logging()
    log = logging.getLogger(name)
    log.handlers.clear()
    log.propagate = True
    return log


logger = setup_logger()
