from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, status

from core.dto.v1.menus import TenantMenuResponseDTO
from core.dto.v1.public import (
    PublicCreateOrderPaymentDTO,
    PublicCreateOrderPaymentResponseDTO,
    PublicTenantInfoResponseDTO,
)
from core.exceptions import BadRequestError
from core.foundation.dependencies import (
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse
from core.foundation.infra.config import settings
from core.models.transaction import Transaction
from services.mongo_menu_service import MENU_COLLECTION, normalize_mongo_menu_categories

router = APIRouter()

_ORDERS_COLLECTION = "orders"


@router.get(
    "/{tenant_slug}/info",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTenantInfoResponseDTO],
)
async def get_public_tenant_info(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
) -> SuccessResponse[PublicTenantInfoResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)

    return SuccessResponse(
        message="Restaurant info retrieved",
        data=PublicTenantInfoResponseDTO(name=tenant.name, slug=tenant.slug),
    )


@router.get(
    "/{tenant_slug}/menu",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMenuResponseDTO],
)
async def get_public_tenant_menu(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    db: MongoDB,
) -> SuccessResponse[TenantMenuResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)

    document = await db[MENU_COLLECTION].find_one({"tenantPublicId": tenant.public_id})
    if document is None:
        return SuccessResponse(
            message="Menu not yet created",
            data=TenantMenuResponseDTO(menu={}, categories=[], updatedAt=None),
        )

    raw_menu = document.get("menu", {})
    normalized_menu = raw_menu if isinstance(raw_menu, dict) else {}
    categories = normalize_mongo_menu_categories(normalized_menu, active_items_only=True)

    return SuccessResponse(
        message="Menu retrieved",
        data=TenantMenuResponseDTO(
            menu=normalized_menu,
            categories=categories,
            updatedAt=document.get("updatedAt"),
        ),
    )


@router.post(
    "/payments/create",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[PublicCreateOrderPaymentResponseDTO],
)
async def create_public_order_payment(
    request: PublicCreateOrderPaymentDTO,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    db: MongoDB,
) -> CreatedResponse[PublicCreateOrderPaymentResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, request.tenant_slug)
    p24_service.validate_tenant_p24_credentials(tenant)

    total_amount = sum(round(item.unit_price * item.quantity * 100) for item in request.items)
    if total_amount <= 0:
        raise BadRequestError(message="Order total must be greater than zero")

    order_dict: dict[str, Any] = {
        "tableNumber": request.table_number,
        "items": [
            {
                "name": item.name,
                "quantity": item.quantity,
                "unitPrice": item.unit_price,
            }
            for item in request.items
        ],
        "note": request.note,
    }

    description = f"Zamówienie - stolik {request.table_number} - {tenant.name}"
    return_url = f"{settings.MOBILE_APP_URL}/payment/return"

    result = await p24_service.register_transaction(
        external_client,
        merchant_id=tenant.p24_merchantid,
        api_key=tenant.p24_api,
        crc=tenant.p24_crc,
        amount=total_amount,
        email=request.email,
        description=description,
        url_return=return_url,
    )

    transaction = Transaction(
        session_id=result.session_id,
        tenant_id=tenant.id,
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
        order=order_dict,
        note=request.note,
    )
    session.add(transaction)
    await session.flush()

    p24_response = result.p24_response
    token = p24_response.get("data", {}).get("token", "")
    if not token:
        raise BadRequestError(message="Payment registration failed - no token received")

    now = datetime.now(UTC)
    mongo_order = {
        "tenantPublicId": tenant.public_id,
        "tenantSlug": tenant.slug,
        "tableNumber": request.table_number,
        "items": order_dict["items"],
        "totalAmount": total_amount,
        "currency": "PLN",
        "email": request.email,
        "status": "pending",
        "sessionId": str(result.session_id),
        "note": request.note,
        "createdAt": now,
    }
    await db[_ORDERS_COLLECTION].insert_one(mongo_order)

    base_url = settings.PRZELEWY24_API_URL.replace("/api/v1", "")
    redirect_url = f"{base_url}/trnRequest/{token}"

    return CreatedResponse(
        message="Payment created successfully",
        data=PublicCreateOrderPaymentResponseDTO(
            token=token,
            redirectUrl=redirect_url,
        ),
    )
