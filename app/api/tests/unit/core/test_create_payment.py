from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

from core.exceptions.http import BadRequestError
from core.foundation.http.schemas import CreatedResponse
from core.models import CreatePaymentRequest
from routes.v1.payments.create_payment import calculate_przelewy24_sign, create_payment


class TestCalculatePrzelewy24Sign:
    result_len = 96

    def test_returns_96_char_hex_string(self) -> None:
        result = calculate_przelewy24_sign(
            session_id="s1",
            merchant_id=1,
            amount=100,
            currency="PLN",
            crc="crc",
        )
        assert len(result) == self.result_len
        assert all(c in "0123456789abcdef" for c in result)

    def test_deterministic_for_same_inputs(self) -> None:
        a = calculate_przelewy24_sign("s", 1, 100, "PLN", "x")
        b = calculate_przelewy24_sign("s", 1, 100, "PLN", "x")
        assert a == b

    def test_different_inputs_different_sign(self) -> None:
        a = calculate_przelewy24_sign("s1", 1, 100, "PLN", "crc")
        b = calculate_przelewy24_sign("s2", 1, 100, "PLN", "crc")
        assert a != b

    def test_utf8_currency_in_sign(self) -> None:
        result_pln = calculate_przelewy24_sign("s", 1, 100, "PLN", "c")
        result_eur = calculate_przelewy24_sign("s", 1, 100, "EUR", "c")
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
    mock_response = MagicMock()
    mock_response.status_code = 201
    mock_response.json.return_value = przelewy24_success_response
    mock_response.raise_for_status = MagicMock()

    with (
        patch("routes.v1.payments.create_payment.settings") as mock_settings,
        patch("routes.v1.payments.create_payment.httpx.AsyncClient") as mock_client_cls,
    ):
        mock_settings.PRZELEWY24_MERCHANT_ID = 12345
        mock_settings.PRZELEWY24_POS_ID = 12345
        mock_settings.PRZELEWY24_CRC = "test-crc"
        mock_settings.PRZELEWY24_API_KEY = "test-api-key"
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        mock_post = AsyncMock(return_value=mock_response)
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        result = await create_payment(create_payment_request)

    assert isinstance(result, CreatedResponse)
    assert result.message == "Payment transaction created successfully"
    assert result.data == przelewy24_success_response
    mock_post.assert_called_once()
    call_args, call_kwargs = mock_post.call_args
    assert call_args[0]
    assert "transaction/register" in str(call_args[0])
    assert call_kwargs["headers"]["Content-Type"] == "application/json"
    assert call_kwargs["headers"]["Authorization"].startswith("Basic ")


@pytest.mark.asyncio
async def test_create_payment_http_status_error(
    create_payment_request: CreatePaymentRequest,
) -> None:
    error_response = MagicMock()
    error_response.status_code = 400
    error_response.json.return_value = {
        "error": {"message": "Invalid merchant configuration"},
    }
    error_response.text = "Bad Request"

    with (
        patch("routes.v1.payments.create_payment.settings") as mock_settings,
        patch("routes.v1.payments.create_payment.httpx.AsyncClient") as mock_client_cls,
    ):
        status_code = 400
        mock_settings.PRZELEWY24_MERCHANT_ID = 12345
        mock_settings.PRZELEWY24_POS_ID = 12345
        mock_settings.PRZELEWY24_CRC = "crc"
        mock_settings.PRZELEWY24_API_KEY = "key"
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        mock_post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Bad Request",
                request=MagicMock(),
                response=error_response,
            ),
        )
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(BadRequestError) as exc_info:
            await create_payment(create_payment_request)

        assert exc_info.value.status_code == status_code
        assert "Przelewy24 API error" in exc_info.value.detail
        assert "Invalid merchant configuration" in exc_info.value.detail


@pytest.mark.asyncio
async def test_create_payment_request_error(
    create_payment_request: CreatePaymentRequest,
) -> None:
    with (
        patch("routes.v1.payments.create_payment.settings") as mock_settings,
        patch("routes.v1.payments.create_payment.httpx.AsyncClient") as mock_client_cls,
    ):
        status_code = 503
        mock_settings.PRZELEWY24_MERCHANT_ID = 12345
        mock_settings.PRZELEWY24_POS_ID = 12345
        mock_settings.PRZELEWY24_CRC = "crc"
        mock_settings.PRZELEWY24_API_KEY = "key"
        mock_settings.PRZELEWY24_API_URL = "https://sandbox.przelewy24.pl/api/v1"

        mock_post = AsyncMock(side_effect=httpx.ConnectError("Connection refused"))
        mock_client_cls.return_value.__aenter__.return_value.post = mock_post
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=None)

        with pytest.raises(BadRequestError) as exc_info:
            await create_payment(create_payment_request)

        assert exc_info.value.status_code == status_code
        assert "Failed to connect to Przelewy24" in exc_info.value.detail
        assert "Connection refused" in exc_info.value.detail
