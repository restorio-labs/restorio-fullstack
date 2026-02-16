import base64
import hashlib
import json
from typing import Any

from fastapi import APIRouter, status

from core.foundation.http.external_client import external_post_json
from core.foundation.http.schemas import CreatedResponse
from core.foundation.infra.config import settings
from core.models import CreatePaymentRequest, Przelewy24RegisterRequest

router = APIRouter()

PRZELEWY24_SERVICE_NAME = "Przelewy24"


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


def _przelewy24_basic_auth() -> str:
    raw = f"{settings.PRZELEWY24_MERCHANT_ID}:{settings.PRZELEWY24_API_KEY}"
    return f"Basic {base64.b64encode(raw.encode('utf-8')).decode('utf-8')}"


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_payment(request: CreatePaymentRequest) -> CreatedResponse[dict[str, Any]]:
    sign = _przelewy24_sign(
        session_id=request.session_id,
        merchant_id=settings.PRZELEWY24_MERCHANT_ID,
        amount=request.amount,
        currency=request.currency,
        crc=settings.PRZELEWY24_CRC,
    )
    body = Przelewy24RegisterRequest(
        merchant_id=settings.PRZELEWY24_MERCHANT_ID,
        pos_id=settings.PRZELEWY24_POS_ID,
        session_id=request.session_id,
        amount=request.amount,
        currency=request.currency,
        description=request.description,
        email=request.email,
        country=request.country,
        language=request.language,
        url_return=request.url_return,
        url_status=request.url_status,
        wait_for_result=request.wait_for_result,
        regulation_accept=request.regulation_accept,
        sign=sign,
    )
    request_data = body.model_dump(by_alias=True, exclude_none=True)

    response_data = await external_post_json(
        f"{settings.PRZELEWY24_API_URL}/transaction/register",
        json=request_data,
        headers={"Authorization": _przelewy24_basic_auth()},
        timeout=30.0,
        service_name=PRZELEWY24_SERVICE_NAME,
    )

    return CreatedResponse[dict[str, Any]](
        message="Payment transaction created successfully",
        data=response_data,
    )
