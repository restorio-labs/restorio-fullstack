import logging

from fastapi import Request

from core.foundation.logging import audit as audit_module
from core.foundation.logging.audit import AuditLogger, _base_payload, _setup_audit_logger


def _request(path: str = "/x", headers=None, client=None) -> Request:
    scope = {
        "type": "http",
        "method": "GET",
        "path": path,
        "headers": headers or [],
        "client": client,
    }
    request = Request(scope)
    request.state.request_id = "req-1"
    return request


def test_setup_audit_logger_uses_the_shared_root_configuration() -> None:
    logger = logging.getLogger("restorio.audit")

    result = _setup_audit_logger()

    assert result is logger
    assert result.handlers == []
    assert result.propagate is True


def test_base_payload_contains_only_operational_fields() -> None:
    req = _request(headers=[(b"user-agent", b"pytest-agent")], client=("127.0.0.1", 1234))
    payload = _base_payload(req)

    assert payload["request_id"] == "req-1"
    assert payload["route"] == "/x"
    assert "ip" not in payload
    assert "user_agent" not in payload


def test_audit_logger_methods_emit_allowlisted_fields(monkeypatch) -> None:
    emitted = []

    class CapturingLogger:
        def info(self, message: str, *, extra: dict[str, object]) -> None:
            emitted.append((message, extra))

    monkeypatch.setattr(audit_module, "_logger", CapturingLogger())

    logger = AuditLogger()
    req = _request(path="/api/v1/auth/login", client=("127.0.0.1", 1))

    logger.login_success(request=req, user_id="u1")
    logger.login_failure(request=req)
    logger.logout(request=req, user_id="u1")
    logger.token_refresh(request=req, user_id="u1", family="fam")
    logger.token_reuse_detected(request=req, user_id="u1", family="fam")
    logger.activation_success(request=req, user_id="u1", tenant_id="t1")
    logger.password_set(request=req, user_id="u1")
    logger.rate_limited(request=req)
    logger.register(request=req)
    logger.password_reset_email_sent(request=req, user_id="u1")
    logger.password_reset_completed(request=req, user_id="u1")
    logger.authorization_decision(
        request=req,
        user_id="u1",
        tenant_id="t1",
        action="menu.write",
        allowed=False,
        policy_id="capability.required",
        reason="not granted",
    )

    expected_audit_events_count = 12
    assert len(emitted) == expected_audit_events_count
    payloads = [payload for _, payload in emitted]
    assert payloads[0]["event"] == "login_success"
    assert payloads[1]["reason"] == "invalid_credentials"
    assert payloads[-1]["event"] == "authorization_decision"
    assert payloads[-1]["allowed"] is False
    assert all("email" not in payload for payload in payloads)
    assert all("ip" not in payload for payload in payloads)
