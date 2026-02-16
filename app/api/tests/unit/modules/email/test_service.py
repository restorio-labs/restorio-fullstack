from unittest.mock import AsyncMock, patch

import pytest

from modules.email.service import send_activation_email


@pytest.mark.asyncio
async def test_send_activation_email_raises_when_resend_api_key_missing() -> None:
    with patch("modules.email.service.settings") as mock_settings:
        mock_settings.RESEND_API_KEY = ""
        mock_settings.RESEND_FROM_EMAIL = "from@example.com"

        with pytest.raises(RuntimeError) as exc_info:
            await send_activation_email(
                to_email="user@example.com",
                restaurant_name="My Restaurant",
                activation_link="https://example.com/activate?id=1",
            )

        assert "RESEND_API_KEY" in exc_info.value.args[0]


@pytest.mark.asyncio
async def test_send_activation_email_raises_when_resend_from_email_missing() -> None:
    with patch("modules.email.service.settings") as mock_settings:
        mock_settings.RESEND_API_KEY = "api-key"
        mock_settings.RESEND_FROM_EMAIL = ""

        with pytest.raises(RuntimeError) as exc_info:
            await send_activation_email(
                to_email="user@example.com",
                restaurant_name="My Restaurant",
                activation_link="https://example.com/activate?id=1",
            )

        assert "RESEND_FROM_EMAIL" in exc_info.value.args[0]


@pytest.mark.asyncio
async def test_send_activation_email_calls_resend_with_correct_payload() -> None:
    with (
        patch("modules.email.service.settings") as mock_settings,
        patch("modules.email.service.asyncio.to_thread", new_callable=AsyncMock) as mock_to_thread,
    ):
        mock_settings.RESEND_API_KEY = "test-key"
        mock_settings.RESEND_FROM_EMAIL = "noreply@restorio.com"
        mock_to_thread.return_value = None

        await send_activation_email(
            to_email="user@example.com",
            restaurant_name="My Restaurant",
            activation_link="https://example.com/activate?id=abc",
        )

        mock_to_thread.assert_called_once()
        call_args = mock_to_thread.call_args
        assert call_args[0][0].__name__ == "send"
        payload = call_args[0][1]
        assert payload["from"] == "noreply@restorio.com"
        assert payload["to"] == ["user@example.com"]
        assert "Activate your My Restaurant account" in payload["subject"]
        assert "My Restaurant" in payload["html"]
        assert "https://example.com/activate?id=abc" in payload["html"]
