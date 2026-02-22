from typing import Any

from fastapi import APIRouter, status

from core.dto.v1.payments import CreateTransactionDTO
from core.exceptions import BadRequestError
from core.foundation.dependencies import (
    ExternalClientDep,
    P24ServiceDep,
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import CreatedResponse
from core.models.transaction import Transaction

router = APIRouter()


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[dict[str, Any]],
)
async def create_payment(
    request: CreateTransactionDTO,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
) -> CreatedResponse[dict[str, Any]]:
    tenant = await tenant_service.get_tenant(session, request.tenant_id)

    if not all([tenant.p24_merchantid, tenant.p24_api, tenant.p24_crc]):
        raise BadRequestError(
            message=f"Tenant '{tenant.name}' does not have Przelewy24 credentials configured"
        )

    result = await p24_service.register_transaction(
        external_client,
        merchant_id=tenant.p24_merchantid,
        api_key=tenant.p24_api,
        crc=tenant.p24_crc,
        amount=request.amount,
        email=request.email,
        description=request.note or "",
    )

    transaction = Transaction(
        session_id=result.session_id,
        tenant_id=request.tenant_id,
        merchant_id=result.merchant_id,
        pos_id=result.pos_id,
        amount=result.amount,
        currency=result.currency,
        description=result.description,
        email=result.email,
        country=result.country,
        language=result.language,
        url_return=result.url_return,
        url_status=result.url_status,
        sign=result.sign,
        wait_for_result=result.wait_for_result,
        regulation_accept=result.regulation_accept,
        status=0,
        order=request.order,
        note=request.note,
    )
    session.add(transaction)
    await session.flush()

    return CreatedResponse[dict[str, Any]](
        message="Payment transaction created successfully",
        data=result.p24_response,
    )
