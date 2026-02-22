import base64
import hashlib
import json
from typing import Any
from uuid import uuid4

from core.foundation.infra.config import settings
from core.models import Przelewy24RegisterRequest
from services.external_client_service import ExternalClient


class P24RegistrationResult:
    def __init__(
        self, *, request_body: Przelewy24RegisterRequest, p24_response: dict[str, Any]
    ) -> None:
        self.session_id = request_body.session_id
        self.merchant_id = request_body.merchant_id
        self.pos_id = request_body.pos_id
        self.amount = request_body.amount
        self.currency = request_body.currency
        self.description = request_body.description
        self.email = request_body.email
        self.country = request_body.country
        self.language = request_body.language
        self.url_return = request_body.url_return
        self.url_status = request_body.url_status
        self.sign = request_body.sign
        self.wait_for_result = request_body.wait_for_result
        self.regulation_accept = request_body.regulation_accept
        self.p24_response = p24_response


class P24Service:
    _PRZELEWY24_SERVICE_NAME = "Przelewy24"

    @staticmethod
    def _przelewy24_sign(
        session_id: str,
        merchant_id: int,
        amount: int,
        currency: str,
        crc: str,
    ) -> str:
        sign_data = {
            "sessionId": session_id,
            "merchantId": merchant_id,
            "amount": amount,
            "currency": currency,
            "crc": crc,
        }
        payload = json.dumps(sign_data, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha384(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _build_basic_auth(merchant_id: int, api_key: str) -> str:
        raw = f"{merchant_id}:{api_key}"
        return f"Basic {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"

    async def register_transaction(
        self,
        external_client: ExternalClient,
        *,
        merchant_id: int,
        api_key: str,
        crc: str,
        amount: int,
        email: str,
        description: str = "",
    ) -> P24RegistrationResult:
        session_id = str(uuid4())

        sign = self._przelewy24_sign(
            session_id=session_id,
            merchant_id=merchant_id,
            amount=amount,
            currency="PLN",
            crc=crc,
        )

        body = Przelewy24RegisterRequest(
            merchant_id=merchant_id,
            pos_id=merchant_id,
            session_id=session_id,
            amount=amount,
            currency="PLN",
            description=description or "Payment transaction",
            email=email,
            country="PL",
            language="pl",
            url_return=f"{settings.FRONTEND_URL}/payment/return",
            url_status=f"{settings.FRONTEND_URL}/api/v1/payments/status",
            wait_for_result=True,
            regulation_accept=True,
            sign=sign,
        )

        request_data = body.model_dump(by_alias=True, exclude_none=True)

        response = await external_client.external_post_json(
            f"{settings.PRZELEWY24_API_URL}/transaction/register",
            json=request_data,
            headers={"Authorization": self._build_basic_auth(merchant_id, api_key)},
            timeout=30.0,
            service_name=self._PRZELEWY24_SERVICE_NAME,
        )

        return P24RegistrationResult(request_body=body, p24_response=response)
