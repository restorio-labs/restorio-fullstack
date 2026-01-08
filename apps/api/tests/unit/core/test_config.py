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
