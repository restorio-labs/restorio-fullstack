import base64
from datetime import date
import hashlib
import json
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import BadRequestError, ConflictError, ExternalAPIError
from core.foundation.infra.config import settings
from core.models import Przelewy24RegisterRequest, Przelewy24VerifyRequest
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from services.external_client_service import ExternalClient


def return_url_with_session_id(base_url: str, session_id: str) -> str:
    parsed = urlparse(base_url)
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    merged = dict(query_pairs)
    merged["sessionId"] = session_id
    new_query = urlencode(list(merged.items()))
    return urlunparse(
        (parsed.scheme, parsed.netloc, parsed.path, parsed.params, new_query, parsed.fragment)
    )


def _p24_api_url(path: str) -> str:
    return f"{settings.PRZELEWY24_API_URL.rstrip('/')}/{path.lstrip('/')}"


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
    _P24_STATUS_REFUNDED = 3

    @staticmethod
    def map_p24_status_to_db(p24_status: int) -> int:
        if p24_status in (0, 1, 2):
            return p24_status
        if p24_status == P24Service._P24_STATUS_REFUNDED:
            return P24Service._P24_STATUS_REFUNDED
        raise BadRequestError(message=f"Unsupported Przelewy24 transaction status: {p24_status}")

    @staticmethod
    def validate_tenant_p24_credentials(tenant: Tenant) -> None:
        if not all([tenant.p24_merchantid, tenant.p24_api, tenant.p24_crc]):
            raise BadRequestError(
                message=f"Tenant '{tenant.name}' does not have Przelewy24 credentials configured"
            )

    @staticmethod
    def _p24_sha384_sign(sign_data: dict[str, Any]) -> str:
        payload = json.dumps(sign_data, separators=(",", ":"), ensure_ascii=False)
        return hashlib.sha384(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _parse_p24_amount_minor(raw: Any) -> int | None:
        if isinstance(raw, bool):
            return None
        if isinstance(raw, float) and raw.is_integer():
            return int(raw)
        if isinstance(raw, int):
            return raw
        return None

    @staticmethod
    def _parse_p24_positive_int_id(raw: Any) -> int | None:
        if isinstance(raw, bool):
            return None
        if isinstance(raw, float) and raw.is_integer():
            n = int(raw)
        elif isinstance(raw, int):
            n = raw
        else:
            return None
        return n if n > 0 else None

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
        return P24Service._p24_sha384_sign(sign_data)

    @staticmethod
    def _przelewy24_verify_sign(
        session_id: str,
        order_id: int,
        amount: int,
        currency: str,
        crc: str,
    ) -> str:
        sign_data = {
            "sessionId": session_id,
            "orderId": order_id,
            "amount": amount,
            "currency": currency,
            "crc": crc,
        }
        return P24Service._p24_sha384_sign(sign_data)

    @staticmethod
    def _order_id_from_p24_data(data: dict[str, Any]) -> int:
        order_id = P24Service._parse_p24_positive_int_id(data.get("orderId"))
        if order_id is None:
            raise BadRequestError(message="Przelewy24 orderId is not available for verification")
        return order_id

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
        url_return: str | None = None,
        session_id: str | None = None,
    ) -> P24RegistrationResult:
        session_id = session_id or str(uuid4())

        sign = self._przelewy24_sign(
            session_id=session_id,
            merchant_id=merchant_id,
            amount=amount,
            currency="PLN",
            crc=crc,
        )

        base_return = url_return or f"{settings.FRONTEND_URL}/payment/return"
        effective_return = return_url_with_session_id(base_return, session_id)

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
            url_return=effective_return,
            url_status=f"{settings.FRONTEND_URL}/api/v1/payments/status",
            wait_for_result=True,
            regulation_accept=True,
            sign=sign,
        )

        request_data = body.model_dump(by_alias=True, exclude_none=True)

        response = await external_client.external_post_json(
            _p24_api_url("transaction/register"),
            json=request_data,
            headers={"Authorization": self._build_basic_auth(merchant_id, api_key)},
            timeout=30.0,
            service_name=self._PRZELEWY24_SERVICE_NAME,
        )

        return P24RegistrationResult(request_body=body, p24_response=response)

    async def verify_transaction_at_przelewy24(
        self,
        external_client: ExternalClient,
        *,
        transaction: Transaction,
        tenant: Tenant,
    ) -> dict[str, Any]:
        self.validate_tenant_p24_credentials(tenant)
        if transaction.tenant_id != tenant.id:
            raise BadRequestError(message="Transaction does not belong to this tenant")

        session_id_str = str(transaction.session_id)
        order_id = transaction.p24_order_id

        if order_id is None or order_id <= 0:
            data, _rc = await self.fetch_transaction_by_session_id(
                external_client,
                session_id=session_id_str,
                merchant_id=tenant.p24_merchantid,
                api_key=tenant.p24_api,
            )
            order_id = self._order_id_from_p24_data(data)
            transaction.p24_order_id = order_id

        sign = self._przelewy24_verify_sign(
            session_id=session_id_str,
            order_id=order_id,
            amount=transaction.amount,
            currency=transaction.currency,
            crc=tenant.p24_crc,
        )

        body = Przelewy24VerifyRequest(
            merchant_id=transaction.merchant_id,
            pos_id=transaction.pos_id,
            session_id=session_id_str,
            amount=transaction.amount,
            currency=transaction.currency,
            order_id=order_id,
            sign=sign,
        )
        request_data = body.model_dump(by_alias=True, exclude_none=True)

        return await external_client.external_put_json(
            _p24_api_url("transaction/verify"),
            json=request_data,
            headers={
                "Authorization": self._build_basic_auth(tenant.p24_merchantid, tenant.p24_api)
            },
            timeout=30.0,
            service_name=self._PRZELEWY24_SERVICE_NAME,
        )

    async def fetch_transaction_by_session_id(
        self,
        external_client: ExternalClient,
        *,
        session_id: str,
        merchant_id: int,
        api_key: str,
    ) -> tuple[dict[str, Any], int]:
        url = _p24_api_url(f"transaction/by/sessionId/{session_id}")
        response = await external_client.external_get_json(
            url,
            headers={"Authorization": self._build_basic_auth(merchant_id, api_key)},
            timeout=30.0,
            service_name=self._PRZELEWY24_SERVICE_NAME,
        )
        err = response.get("error")
        if err is not None:
            if isinstance(err, dict):
                msg = str(err.get("errorMessage") or err.get("message") or err)
            else:
                msg = str(err)
            raise ExternalAPIError(message=f"{self._PRZELEWY24_SERVICE_NAME} error: {msg}")
        rc = response.get("responseCode")
        if rc is not None and int(rc) != 0:
            raise ExternalAPIError(
                message=f"{self._PRZELEWY24_SERVICE_NAME} error: responseCode {rc}",
            )
        data = response.get("data")
        if not isinstance(data, dict):
            raise BadRequestError(message="Invalid Przelewy24 response: missing data")
        response_code = 0 if rc is None else int(rc)
        return data, response_code

    async def apply_p24_lookup_to_transaction(
        self,
        external_client: ExternalClient,
        *,
        transaction: Transaction,
        tenant: Tenant,
    ) -> tuple[dict[str, Any], int]:
        self.validate_tenant_p24_credentials(tenant)
        data, response_code = await self.fetch_transaction_by_session_id(
            external_client,
            session_id=str(transaction.session_id),
            merchant_id=tenant.p24_merchantid,
            api_key=tenant.p24_api,
        )
        amount = self._parse_p24_amount_minor(data.get("amount"))
        if amount is None:
            raise BadRequestError(message="Invalid Przelewy24 transaction payload")

        currency = data.get("currency")
        p24_status = data.get("status")

        if not isinstance(p24_status, int):
            raise BadRequestError(message="Invalid Przelewy24 transaction payload")
        if amount != transaction.amount:
            raise ConflictError(message="Transaction amount does not match Przelewy24 data")
        if currency is not None and currency != transaction.currency:
            raise ConflictError(message="Transaction currency does not match Przelewy24 data")

        db_status = self.map_p24_status_to_db(p24_status)
        transaction.status = db_status
        transaction.p24_order_id = self._parse_p24_positive_int_id(data.get("orderId"))

        return data, response_code

    async def get_transactions_page(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        *,
        date_from: date | None = None,
        date_to: date | None = None,
        page: int = 1,
        pagination: int = 20,
    ) -> tuple[list[Transaction], int]:
        base_query = select(Transaction).where(Transaction.tenant_id == tenant_id)

        if date_from is not None:
            base_query = base_query.where(func.date(Transaction.created_at) >= date_from)
        if date_to is not None:
            base_query = base_query.where(func.date(Transaction.created_at) <= date_to)

        count_query = select(func.count()).select_from(base_query.subquery())
        total = (await session.execute(count_query)).scalar_one()

        offset = (page - 1) * pagination
        items_query = (
            base_query.order_by(Transaction.created_at.desc()).offset(offset).limit(pagination)
        )
        items = list((await session.execute(items_query)).scalars().all())

        return items, total
