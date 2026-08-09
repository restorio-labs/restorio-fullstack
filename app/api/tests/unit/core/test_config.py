import pytest

from core.foundation.infra.config import Settings

PASSTHROUGH_INT_VALUE = 12
NUMERIC_STRING_VALUE = "34"
NUMERIC_STRING_PARSED_VALUE = 34


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
        assert Settings.parse_przelewy24_int(PASSTHROUGH_INT_VALUE) == PASSTHROUGH_INT_VALUE

    def test_parse_przelewy24_int_from_numeric_string(self) -> None:
        assert Settings.parse_przelewy24_int(NUMERIC_STRING_VALUE) == NUMERIC_STRING_PARSED_VALUE

    def test_parse_przelewy24_int_returns_zero_for_invalid_values(self) -> None:
        assert Settings.parse_przelewy24_int("abc") == 0
        assert Settings.parse_przelewy24_int(None) == 0  # type: ignore[arg-type]


class TestSettingsProductionSecrets:
    def test_insecure_secret_rejected_in_production(self, monkeypatch: pytest.MonkeyPatch) -> None:
        monkeypatch.setenv("ENV", "production")
        with pytest.raises(ValueError, match="FATAL: SECRET_KEY is set to an insecure default"):
            Settings(SECRET_KEY="change-me-in-production")


class TestSettingsEnvironmentTopology:
    def test_preview_urls_and_cookies_cannot_be_overridden(self) -> None:
        settings = Settings(
            ENV="preview",
            CORS_ORIGINS=["https://untrusted.example"],
            FRONTEND_URL="https://untrusted.example",
            API_BASE_URL="https://untrusted.example",
            WAITER_PANEL_URL="https://untrusted.example",
            MOBILE_APP_URL="https://untrusted.example",
            ACCESS_TOKEN_COOKIE_NAME="untrusted",
            REFRESH_TOKEN_COOKIE_NAME="untrusted",
            SESSION_HINT_COOKIE="untrusted",
        )

        assert settings.CORS_ORIGINS == settings.PREVIEW_ORIGINS
        assert settings.FRONTEND_URL == "https://preview.restorio.org"
        assert settings.API_BASE_URL == "https://preview-api.restorio.org"
        assert settings.WAITER_PANEL_URL == "https://preview-waiter.restorio.org"
        assert settings.MOBILE_APP_URL == "https://preview-mobile.restorio.org"
        assert settings.ACCESS_TOKEN_COOKIE_NAME == "preview_rat"
        assert settings.REFRESH_TOKEN_COOKIE_NAME == "preview_rrt"
        assert settings.SESSION_HINT_COOKIE == "preview_rshc"

    def test_production_urls_cannot_be_overridden(self) -> None:
        settings = Settings(
            ENV="production",
            SECRET_KEY="a" * 64,
            FRONTEND_URL="https://untrusted.example",
            API_BASE_URL="https://untrusted.example",
            WAITER_PANEL_URL="https://untrusted.example",
            MOBILE_APP_URL="https://untrusted.example",
        )

        assert settings.CORS_ORIGINS == settings.PRODUCTION_ORIGINS
        assert settings.FRONTEND_URL == "https://restorio.org"
        assert settings.API_BASE_URL == "https://api.restorio.org"
        assert settings.WAITER_PANEL_URL == "https://waiter.restorio.org"
        assert settings.MOBILE_APP_URL == "https://mobile.restorio.org"
