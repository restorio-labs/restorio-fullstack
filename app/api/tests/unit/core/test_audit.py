import json
import logging

from fastapi import Request
import pytest

from core.foundation.logging import audit as audit_module
from core.foundation.logging.audit import AuditLogger


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


def test_setup_audit_logger_returns_existing_logger_when_handler_present() -> None:
    setup = getattr(audit_module, "_setup_audit_logger", None)
    if setup is None:
        pytest.skip("Audit module does not expose _setup_audit_logger")
    logger = logging.getLogger("restorio.audit")
    if not logger.handlers:
        logger.addHandler(logging.NullHandler())

    result = setup()

    assert result is logger


def test_audit_payload_uses_forwarded_client_ip(monkeypatch) -> None:
    emitted: list[str] = []
    monkeypatch.setattr(audit_module, "_logger", type("L", (), {"info": emitted.append})())
    req = _request(headers=[(b"x-forwarded-for", b"10.0.0.1, 10.0.0.2")])
    AuditLogger().rate_limited(request=req)
    payload = json.loads(emitted[0])
    assert payload["ip"] == "10.0.0.1"


def test_audit_payload_ip_unknown_without_client(monkeypatch) -> None:
    emitted: list[str] = []
    monkeypatch.setattr(audit_module, "_logger", type("L", (), {"info": emitted.append})())
    req = _request(client=None)
    AuditLogger().rate_limited(request=req)
    payload = json.loads(emitted[0])
    assert payload["ip"] == "unknown"


def test_audit_payload_contains_common_fields(monkeypatch) -> None:
    emitted: list[str] = []
    monkeypatch.setattr(audit_module, "_logger", type("L", (), {"info": emitted.append})())
    req = _request(headers=[(b"user-agent", b"pytest-agent")], client=("127.0.0.1", 1234))
    AuditLogger().rate_limited(request=req)
    payload = json.loads(emitted[0])

    assert payload["request_id"] == "req-1"
    assert payload["ip"] == "127.0.0.1"
    assert payload["user_agent"] == "pytest-agent"
    assert payload["path"] == "/x"
    assert isinstance(payload["ts"], float)


def test_audit_logger_methods_emit_json(monkeypatch) -> None:
    emitted: list[str] = []

    monkeypatch.setattr(audit_module, "_logger", type("L", (), {"info": emitted.append})())

    logger = AuditLogger()
    req = _request(path="/api/v1/auth/login", client=("127.0.0.1", 1))

    logger.login_success(request=req, user_id="u1", email="a@b.com")
    logger.login_failure(request=req, email="a@b.com")
    logger.logout(request=req, user_id="u1")
    logger.token_refresh(request=req, user_id="u1", family="fam")
    logger.token_reuse_detected(request=req, user_id="u1", family="fam")
    logger.activation_success(request=req, user_id="u1", tenant_id="t1")
    logger.password_set(request=req, user_id="u1")
    logger.rate_limited(request=req)
    logger.register(request=req, email="a@b.com", tenant_name="Tenant")

    expected_audit_events_count = 9
    assert len(emitted) == expected_audit_events_count
    parsed = [json.loads(item) for item in emitted]
    assert parsed[0]["event"] == "login_success"
    assert parsed[1]["reason"] == "invalid_credentials"
    assert parsed[-1]["event"] == "register"
