"""Security audit events emitted through the shared JSON logger."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import Request


def _setup_audit_logger() -> logging.Logger:
    log = logging.getLogger("restorio.audit")
    log.handlers.clear()
    log.propagate = True
    return log


_logger = _setup_audit_logger()


def _base_payload(request: Request) -> dict[str, str | None]:
    route = request.scope.get("route")
    return {
        "request_id": getattr(request.state, "request_id", None),
        "route": getattr(route, "path", request.url.path),
    }


class AuditLogger:
    def _emit(self, event: str, request: Request, **extra: Any) -> None:
        payload = _base_payload(request)
        payload["event"] = event
        payload.update(extra)
        _logger.info("audit_event", extra=payload)

    def login_success(self, *, request: Request, user_id: str) -> None:
        self._emit("login_success", request, user_id=user_id)

    def login_failure(self, *, request: Request, reason: str = "invalid_credentials") -> None:
        self._emit("login_failure", request, reason=reason)

    def logout(self, *, request: Request, user_id: str | None = None) -> None:
        self._emit("logout", request, user_id=user_id)

    def token_refresh(self, *, request: Request, user_id: str, family: str) -> None:
        del family
        self._emit("token_refresh", request, user_id=user_id)

    def token_reuse_detected(self, *, request: Request, user_id: str | None, family: str) -> None:
        del family
        self._emit("token_reuse_detected", request, user_id=user_id)

    def activation_success(
        self, *, request: Request, user_id: str, tenant_id: str | None = None
    ) -> None:
        self._emit("activation_success", request, user_id=user_id, tenant_id=tenant_id)

    def password_set(self, *, request: Request, user_id: str) -> None:
        self._emit("password_set", request, user_id=user_id)

    def rate_limited(self, *, request: Request) -> None:
        self._emit("rate_limited", request)

    def register(self, *, request: Request) -> None:
        self._emit("register", request)

    def password_reset_email_sent(self, *, request: Request, user_id: str) -> None:
        self._emit("password_reset_email_sent", request, user_id=user_id)

    def password_reset_completed(self, *, request: Request, user_id: str) -> None:
        self._emit("password_reset_completed", request, user_id=user_id)

    def authorization_decision(
        self,
        *,
        request: Request,
        user_id: str,
        tenant_id: str | None,
        action: str,
        allowed: bool,
        policy_id: str,
        reason: str,
    ) -> None:
        self._emit(
            "authorization_decision",
            request,
            user_id=user_id,
            tenant_id=tenant_id,
            action=action,
            allowed=allowed,
            policy_id=policy_id,
            reason=reason,
        )


audit = AuditLogger()
