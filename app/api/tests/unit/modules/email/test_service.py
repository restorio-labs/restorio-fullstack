from unittest.mock import AsyncMock, patch

import pytest

from services.email_service import EmailService


@pytest.mark.asyncio
async def test_send_activation_email_raises_when_resend_api_key_missing() -> None:
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.RESEND_API_KEY = ""
        mock_settings.RESEND_FROM_EMAIL = "from@example.com"
        email_service = EmailService()

        with pytest.raises(RuntimeError) as exc_info:
            await email_service.send_activation_email(
                to_email="user@example.com",
                restaurant_name="My Restaurant",
                activation_link="https://example.com/activate?id=1",
            )

        assert "RESEND_API_KEY" in exc_info.value.args[0]


@pytest.mark.asyncio
async def test_send_activation_email_raises_when_resend_from_email_missing() -> None:
    with patch("services.email_service.settings") as mock_settings:
        mock_settings.RESEND_API_KEY = "api-key"
        mock_settings.RESEND_FROM_EMAIL = ""
        email_service = EmailService()

        with pytest.raises(RuntimeError) as exc_info:
            await email_service.send_activation_email(
                to_email="user@example.com",
                restaurant_name="My Restaurant",
                activation_link="https://example.com/activate?id=1",
            )

        assert "RESEND_FROM_EMAIL" in exc_info.value.args[0]


@pytest.mark.asyncio
async def test_send_activation_email_calls_resend_with_correct_payload() -> None:
    with (
        patch("services.email_service.settings") as mock_settings,
        patch("services.email_service.asyncio.to_thread", new_callable=AsyncMock) as mock_to_thread,
    ):
        mock_settings.RESEND_API_KEY = "test-key"
        mock_settings.RESEND_FROM_EMAIL = "noreply@restorio.org"
        mock_to_thread.return_value = None
        email_service = EmailService()

        await email_service.send_activation_email(
            to_email="user@example.com",
            restaurant_name="My Restaurant",
            activation_link="https://example.com/activate?id=abc",
        )

        mock_to_thread.assert_called_once()
        call_args = mock_to_thread.call_args
        assert call_args[0][0].__name__ == "send"
        payload = call_args[0][1]
        assert payload["from"] == "noreply@restorio.org"
        assert payload["to"] == ["user@example.com"]
        assert "Activate your My Restaurant account" in payload["subject"]
        assert "My Restaurant" in payload["html"]
        assert "https://example.com/activate?id=abc" in payload["html"]
