import io
import json
import logging

from core.foundation.logging.logger import (
    JsonLogFormatter,
    SafeStreamHandler,
    bind_request_context,
    reset_request_context,
    setup_logger,
)

_EXPECTED_DURATION_MS = 18.3
_OK_STATUS = 200


class BrokenStreamError(OSError):
    pass


def test_setup_logger_configures_one_json_root_handler() -> None:
    logger = setup_logger("restorio-test-logger")

    assert logger.propagate is True
    assert len(logging.getLogger().handlers) == 1
    assert isinstance(logging.getLogger().handlers[0].formatter, JsonLogFormatter)


def test_json_formatter_includes_request_context_and_allowlisted_fields() -> None:
    formatter = JsonLogFormatter()
    record = logging.LogRecord(
        name="restorio-test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="Request completed",
        args=(),
        exc_info=None,
    )
    record.duration_ms = _EXPECTED_DURATION_MS
    record.http_status = _OK_STATUS
    record.password = "must-not-appear"
    record.ip = "198.51.100.5"
    token = bind_request_context(request_id="req-1", trace_id="trace-1", route="/api/v1/orders")

    try:
        payload = json.loads(formatter.format(record))
    finally:
        reset_request_context(token)

    assert payload["request_id"] == "req-1"
    assert payload["trace_id"] == "trace-1"
    assert payload["route"] == "/api/v1/orders"
    assert payload["duration_ms"] == _EXPECTED_DURATION_MS
    assert payload["http_status"] == _OK_STATUS
    assert "password" not in payload
    assert "ip" not in payload
    assert payload["service"] == "restorio-api"
    assert payload["git_sha"]


def test_json_formatter_redacts_secret_bearing_messages_and_exceptions() -> None:
    formatter = JsonLogFormatter()

    error = ValueError("token=super-secret")
    record = logging.LogRecord(
        name="restorio-test",
        level=logging.ERROR,
        pathname=__file__,
        lineno=1,
        msg="Authorization=Bearer very-secret",
        args=(),
        exc_info=(ValueError, error, None),
    )

    payload = json.loads(formatter.format(record))

    assert "very-secret" not in payload["message"]
    assert "super-secret" not in payload["exception"]["message"]
    assert "super-secret" not in payload["exception"]["stacktrace"]


def test_stream_handler_suppresses_write_failures() -> None:
    class BrokenStream(io.StringIO):
        def write(self, _value: str) -> int:
            raise BrokenStreamError

    handler = SafeStreamHandler(BrokenStream())
    handler.setFormatter(JsonLogFormatter())
    record = logging.LogRecord(
        name="restorio-test",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="This must not fail the request",
        args=(),
        exc_info=None,
    )

    handler.emit(record)
