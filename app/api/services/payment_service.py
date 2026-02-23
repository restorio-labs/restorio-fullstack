import base64
from datetime import date
import hashlib
import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BadRequestError
from core.foundation.infra.config import settings
from core.models import Przelewy24RegisterRequest
from core.models.tenant import Tenant
from core.models.transaction import Transaction
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
    def validate_tenant_p24_credentials(tenant: Tenant) -> None:
        if not all([tenant.p24_merchantid, tenant.p24_api, tenant.p24_crc]):
            raise BadRequestError(
                message=f"Tenant '{tenant.name}' does not have Przelewy24 credentials configured"
            )

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

    async def list_transactions(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Transaction], int]:
        base_query = select(Transaction).where(Transaction.tenant_id == tenant_id)

        if date_from is not None:
            base_query = base_query.where(func.date(Transaction.created_at) >= date_from)
        if date_to is not None:
            base_query = base_query.where(func.date(Transaction.created_at) <= date_to)

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await session.execute(count_query)).scalar_one()

        offset = (page - 1) * page_size
        items_query = (
            base_query.order_by(Transaction.created_at.desc()).offset(offset).limit(page_size)
        )
        items = list((await session.execute(items_query)).scalars().all())

        return items, total
