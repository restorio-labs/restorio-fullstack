import base64
import hashlib
import json
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from core.foundation.http.schemas import CreatedResponse
from core.foundation.infra.config import settings

router = APIRouter()


class CreatePaymentRequest(BaseModel):
    """model requestu do utworzenia platnosci przez przelewy24."""

    session_id: str = Field(..., alias="sessionId", description="unikalny identyfikator sesji")
    amount: int = Field(..., gt=0, description="kwota w groszach (np. 10000 = 100.00 PLN)")
    currency: str = Field(default="PLN", description="kod waluty")
    description: str = Field(..., description="opis platnosci")
    email: str = Field(..., description="adres email klienta")
    country: str = Field(default="PL", description="kod kraju")
    language: str = Field(default="pl", description="kod jezyka")
    url_return: str = Field(..., alias="urlReturn", description="adres url powrotu po platnosci")
    url_status: str = Field(..., alias="urlStatus", description="adres url callbacku statusu")
    wait_for_result: bool = Field(default=True, alias="waitForResult", description="czekaj na wynik platnosci")
    regulation_accept: bool = Field(default=False, alias="regulationAccept", description="akceptacja regulaminu")


class Przelewy24RegisterRequest(BaseModel):
    """model requestu do api przelewy24 transaction/register."""

    model_config = ConfigDict(populate_by_name=True)

    merchant_id: int = Field(..., alias="merchantId")
    pos_id: int = Field(..., alias="posId")
    session_id: str = Field(..., alias="sessionId")
    amount: int
    currency: str
    description: str
    email: str
    country: str
    language: str
    url_return: str = Field(..., alias="urlReturn")
    url_status: str = Field(..., alias="urlStatus")
    wait_for_result: bool = Field(..., alias="waitForResult")
    regulation_accept: bool = Field(..., alias="regulationAccept")
    sign: str


def calculate_przelewy24_sign(
    session_id: str,
    merchant_id: int,
    amount: int,
    currency: str,
    crc: str,
) -> str:
    """liczenie signa dla przelewy24 (SHA384)."""
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
    """tworzy transakcje platnosci przez przelewy24. endpoint: waliduje request, liczy sign (SHA384), wysyla do api, zwraca token i url przekierowania."""
    # liczenie hasza sign
    sign = calculate_przelewy24_sign(
        session_id=request.session_id,
        merchant_id=settings.PRZELEWY24_MERCHANT_ID,
        amount=request.amount,
        currency=request.currency,
        crc=settings.PRZELEWY24_CRC,
    )

    # przygotowanie requestu do przelewy24
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

    # konwersja do slownika pod json
    request_data = przelewy24_request.model_dump(by_alias=True, exclude_none=True)

    # dane autoryzacyjne (z env)
    auth_string = f"{settings.PRZELEWY24_MERCHANT_ID}:{settings.PRZELEWY24_API_KEY}"
    auth_bytes = auth_string.encode("utf-8")
    auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

    # wysylka requestu do przelewy24
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
