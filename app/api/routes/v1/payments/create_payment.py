import base64
import hashlib
import json
from typing import Any

from fastapi import APIRouter, HTTPException, status
import httpx

from core.foundation.http.schemas import CreatedResponse
from core.foundation.infra.config import settings
from core.models import CreatePaymentRequest, Przelewy24RegisterRequest

router = APIRouter()


def calculate_przelewy24_sign(
    session_id: str,
    merchant_id: int,
    amount: int,
    currency: str,
    crc: str,
) -> str:
    """Compute SHA384 signature for Przelewy24 API."""
    sign_data = {
        "sessionId": session_id,
        "merchantId": merchant_id,
        "amount": amount,
        "currency": currency,
        "crc": crc,
    }
    json_string = json.dumps(sign_data, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha384(json_string.encode("utf-8")).hexdigest()


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_payment(request: CreatePaymentRequest) -> CreatedResponse[dict[str, Any]]:
    """Create a payment transaction via Przelewy24. Validates request, computes sign (SHA384), calls API, returns token and redirect URL."""
    sign = calculate_przelewy24_sign(
        session_id=request.session_id,
        merchant_id=settings.PRZELEWY24_MERCHANT_ID,
        amount=request.amount,
        currency=request.currency,
        crc=settings.PRZELEWY24_CRC,
    )

    przelewy24_request = Przelewy24RegisterRequest(
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

    request_data = przelewy24_request.model_dump(by_alias=True, exclude_none=True)

    auth_string = f"{settings.PRZELEWY24_MERCHANT_ID}:{settings.PRZELEWY24_API_KEY}"
    auth_bytes = auth_string.encode("utf-8")
    auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{settings.PRZELEWY24_API_URL}/transaction/register",
                json=request_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Basic {auth_b64}",
                },
                timeout=30.0,
            )
            response.raise_for_status()
            response_data = response.json()
        except httpx.HTTPStatusError as e:
            error_detail = "Unknown error"
            try:
                error_response = e.response.json()
                error_detail = error_response.get("error", {}).get("message", str(e))
            except Exception:
                error_detail = e.response.text or str(e)

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"Przelewy24 API error: {error_detail}",
            ) from e
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to connect to Przelewy24: {str(e)}",
            ) from e

    return CreatedResponse[dict[str, Any]](
        message="Payment transaction created successfully",
        data=response_data,
    )
