from core.foundation.infra.config import Settings


class TestSettingsCorsOrigins:
    def test_parse_cors_origins_json_string(self) -> None:
        value = '["http://a.test", "http://b.test"]'
        result = Settings.parse_cors_origins(value)

        assert result == ["http://a.test", "http://b.test"]

    def test_parse_cors_origins_comma_separated_string(self) -> None:
        value = "http://a.test, http://b.test"
        result = Settings.parse_cors_origins(value)

        assert result == ["http://a.test", "http://b.test"]


class TestSettingsPrzelewy24Int:
    def test_parse_przelewy24_int_passthrough_for_int(self) -> None:
        assert Settings.parse_przelewy24_int(12) == 12

    def test_parse_przelewy24_int_from_numeric_string(self) -> None:
        assert Settings.parse_przelewy24_int("34") == 34

    def test_parse_przelewy24_int_returns_zero_for_invalid_values(self) -> None:
        assert Settings.parse_przelewy24_int("abc") == 0
        assert Settings.parse_przelewy24_int(None) == 0  # type: ignore[arg-type]
