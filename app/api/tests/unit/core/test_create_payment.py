from unittest.mock import AsyncMock, Mock, patch

from fastapi import status
import pytest

from core.exceptions import ExternalAPIError, ServiceUnavailableError
from core.foundation.http.responses import CreatedResponse
from core.models import CreatePaymentRequest
from routes.v1.payments.create_payment import create_payment
from services.payment_service import P24Service


class TestCalculatePrzelewy24Sign:
    EXPECTED_SIGN_LENGTH = 96

    def test_returns_96_char_hex_string(self) -> None:
        result = P24Service._przelewy24_sign(
            session_id="s1",
            merchant_id=1,
            amount=100,
            currency="PLN",
            crc="crc",
        )
        assert len(result) == self.EXPECTED_SIGN_LENGTH
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic_for_same_inputs(self) -> None:
        a = P24Service._przelewy24_sign("s", 1, 100, "PLN", "x")
        b = P24Service._przelewy24_sign("s", 1, 100, "PLN", "x")
        assert a == b

    def test_different_inputs_different_sign(self) -> None:
        a = P24Service._przelewy24_sign("s1", 1, 100, "PLN", "crc")
        b = P24Service._przelewy24_sign("s2", 1, 100, "PLN", "crc")
        assert a != b

    def test_utf8_currency_in_sign(self) -> None:
        result_pln = P24Service._przelewy24_sign("s", 1, 100, "PLN", "c")
        result_eur = P24Service._przelewy24_sign("s", 1, 100, "EUR", "c")
        assert result_pln != result_eur


@pytest.fixture
def create_payment_request() -> CreatePaymentRequest:
    return CreatePaymentRequest(
        sessionId="test-session-123",
        amount=10000,
        currency="PLN",
        description="Test order",
        email="user@example.com",
        country="PL",
        language="pl",
        urlReturn="https://example.com/return",
        urlStatus="https://example.com/status",
        waitForResult=True,
        regulationAccept=True,
    )


@pytest.fixture
def przelewy24_success_response() -> dict:
    return {"data": {"token": "p24-token-xyz"}, "responseCode": 0}


@pytest.mark.asyncio
async def test_create_payment_success(
    create_payment_request: CreatePaymentRequest,
    przelewy24_success_response: dict,
) -> None:
    with patch("routes.v1.payments.create_payment.settings") as mock_settings:
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        service = Mock()
        service._merchant_id = 12345
        service._pos_id = 12345
        service._crc = "test-crc"
        service._PRZELEWY24_SERVICE_NAME = "Przelewy24"
        service._przelewy24_sign.return_value = "a" * 96
        service._przelewy24_basic_auth.return_value = "Basic test-auth"

        external_client = Mock()
        external_client.external_post_json = AsyncMock(return_value=przelewy24_success_response)

        result = await create_payment(create_payment_request, service, external_client)

    assert isinstance(result, CreatedResponse)
    assert result.message == "Payment transaction created successfully"
    assert result.data == przelewy24_success_response
    external_client.external_post_json.assert_called_once()
    args, kwargs = external_client.external_post_json.call_args
    assert "transaction/register" in str(args[0])
    assert kwargs.get("headers", {}).get("Authorization", "").startswith("Basic ")


@pytest.mark.asyncio
async def test_create_payment_http_status_error(
    create_payment_request: CreatePaymentRequest,
) -> None:
    with patch("routes.v1.payments.create_payment.settings") as mock_settings:
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        service = Mock()
        service._merchant_id = 12345
        service._pos_id = 12345
        service._crc = "crc"
        service._PRZELEWY24_SERVICE_NAME = "Przelewy24"
        service._przelewy24_sign.return_value = "a" * 96
        service._przelewy24_basic_auth.return_value = "Basic test-auth"

        external_client = Mock()
        external_client.external_post_json = AsyncMock(
            side_effect=ExternalAPIError(
                message="Przelewy24 error: Invalid merchant configuration",
            )
        )

        with pytest.raises(ExternalAPIError) as exc_info:
            await create_payment(create_payment_request, service, external_client)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Przelewy24" in exc_info.value.detail
        assert "Invalid merchant configuration" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_payment_request_error(
    create_payment_request: CreatePaymentRequest,
) -> None:
    with patch("routes.v1.payments.create_payment.settings") as mock_settings:
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        service = Mock()
        service._merchant_id = 12345
        service._pos_id = 12345
        service._crc = "crc"
        service._PRZELEWY24_SERVICE_NAME = "Przelewy24"
        service._przelewy24_sign.return_value = "a" * 96
        service._przelewy24_basic_auth.return_value = "Basic test-auth"

        external_client = Mock()
        external_client.external_post_json = AsyncMock(
            side_effect=ServiceUnavailableError(
                message="Failed to connect to Przelewy24: Connection refused",
            )
        )

        with pytest.raises(ServiceUnavailableError) as exc_info:
            await create_payment(create_payment_request, service, external_client)

        assert exc_info.value.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert "Przelewy24" in exc_info.value.detail
        assert "Connection refused" in exc_info.value.detail
