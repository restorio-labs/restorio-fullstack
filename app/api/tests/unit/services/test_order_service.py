from datetime import UTC, datetime

from services.order_service import _resolve_timezone, _to_iso


def test_to_iso_converts_utc_datetime_to_requested_timezone() -> None:
    value = datetime(2026, 4, 7, 19, 55, 30, 835000, tzinfo=UTC)

    result = _to_iso(value, timezone_name="Europe/Warsaw")

    assert result == "2026-04-07T21:55:30.835000+02:00"


def test_to_iso_falls_back_to_utc_for_invalid_timezone() -> None:
    value = datetime(2026, 4, 7, 19, 55, 30, 835000, tzinfo=UTC)

    result = _to_iso(value, timezone_name="Mars/Olympus")

    assert result == "2026-04-07T19:55:30.835000+00:00"


def test_resolve_timezone_defaults_to_utc() -> None:
    timezone = _resolve_timezone(None)

    assert timezone.key == "UTC"
