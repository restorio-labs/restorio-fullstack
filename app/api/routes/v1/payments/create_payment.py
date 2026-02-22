from typing import Any

from fastapi import APIRouter, status

from core.foundation.dependencies import ExternalClientDep, P24ServiceDep
from core.foundation.http.responses import CreatedResponse
from core.foundation.infra.config import settings
from core.models import CreatePaymentRequest, Przelewy24RegisterRequest

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[dict[str, Any]],
)
async def create_payment(
    request: CreatePaymentRequest,
    service: P24ServiceDep,
    external_client: ExternalClientDep,
) -> CreatedResponse[dict[str, Any]]:
    sign = service._przelewy24_sign(
        session_id=request.session_id,
        merchant_id=service._merchant_id,
        amount=request.amount,
        currency=request.currency,
        crc=service._crc,
    )
    body = Przelewy24RegisterRequest(
        merchant_id=service._merchant_id,
        pos_id=service._pos_id,
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

    response_data = await external_client.external_post_json(
        f"{settings.PRZELEWY24_API_URL}/transaction/register",
        json=request_data,
        headers={"Authorization": service._przelewy24_basic_auth()},
        timeout=30.0,
        service_name=service._PRZELEWY24_SERVICE_NAME,
    )

    return CreatedResponse[dict[str, Any]](
        message="Payment transaction created successfully",
        data=response_data,
    )
