from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select

from core.dto.v1.menus import TenantMenuResponseDTO
from core.dto.v1.public import (
    PublicAcquireTableSessionDTO,
    PublicCreateOrderPaymentDTO,
    PublicCreateOrderPaymentResponseDTO,
    PublicP24TransactionSyncResponseDTO,
    PublicRefreshTableSessionDTO,
    PublicReleaseTableSessionDTO,
    PublicTableSessionResponseDTO,
    PublicTenantInfoResponseDTO,
)
from core.exceptions import BadRequestError, NotFoundResponse
from core.foundation.client_ip import get_client_ip
from core.foundation.dependencies import (
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantMobileFaviconStorageServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse
from core.foundation.infra.config import settings
from core.models.transaction import Transaction
from services.mongo_menu_service import MENU_COLLECTION, normalize_mongo_menu_categories
from services.tenant_mobile_config_service import tenant_mobile_config_service

router = APIRouter()

_ORDERS_COLLECTION = "orders"

MONGO_ORDER_STATUS_UNPAID = "unpaid"
MONGO_ORDER_STATUS_PAID = "paid"
MONGO_ORDER_STATUS_ACCEPTED = "accepted"
MONGO_ORDER_STATUS_REFUNDED = "refunded"

_TX_STATUS_UNPAID = 0
_TX_STATUS_PAID = 1
_TX_STATUS_ACCEPTED = 2
_TX_STATUS_REFUNDED = 3

_RESOURCE_TRANSACTION = "Transaction"


def _extract_client_fingerprint(request: Request) -> str | None:
    fingerprint = request.headers.get("X-Device-Fingerprint") or request.headers.get("User-Agent")
    if not fingerprint:
        return None
    return fingerprint.strip() or None


def _public_table_session_response(
    *,
    lock_token: str,
    expires_at: datetime,
    owner_type: str,
    table_ref: str,
    table_number: int | None,
    table_status: str = "locked",
    message: str | None = None,
) -> PublicTableSessionResponseDTO:
    return PublicTableSessionResponseDTO(
        lockToken=lock_token,
        expiresAt=expires_at.isoformat(),
        tableStatus=table_status,
        ownerType=owner_type,
        tableRef=table_ref,
        tableNumber=table_number,
        message=message,
    )


def _mongo_order_status_from_transaction(transaction_status: int) -> str:
    if transaction_status == _TX_STATUS_UNPAID:
        return MONGO_ORDER_STATUS_UNPAID
    if transaction_status == _TX_STATUS_PAID:
        return MONGO_ORDER_STATUS_PAID
    if transaction_status == _TX_STATUS_ACCEPTED:
        return MONGO_ORDER_STATUS_ACCEPTED
    if transaction_status == _TX_STATUS_REFUNDED:
        return MONGO_ORDER_STATUS_REFUNDED
    return MONGO_ORDER_STATUS_UNPAID


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
    mc = await tenant_mobile_config_service.get_by_tenant_id(session, tenant.id)
    favicon_path = f"/public/{tenant.slug}/favicon.ico" if mc and mc.favicon_object_key else None

    return SuccessResponse(
        message="Restaurant info retrieved",
        data=PublicTenantInfoResponseDTO(
            name=tenant.name,
            slug=tenant.slug,
            pageTitle=mc.page_title if mc else None,
            faviconPath=favicon_path,
            themeOverride=mc.theme_override if mc else None,
        ),
    )


@router.get(
    "/{tenant_slug}/favicon.ico",
    status_code=status.HTTP_200_OK,
    response_class=Response,
)
async def get_public_tenant_favicon(
    tenant_slug: str,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    storage: TenantMobileFaviconStorageServiceDep,
) -> Response:
    tenant = await tenant_service.get_tenant_by_slug(session, tenant_slug)
    mc = await tenant_mobile_config_service.get_by_tenant_id(session, tenant.id)

    if not mc or not mc.favicon_object_key:
        msg = "Favicon"
        raise NotFoundResponse(msg, tenant_slug)

    stream = storage.get_object_stream(mc.favicon_object_key)
    try:
        data = stream.read()
    finally:
        stream.close()
        stream.release_conn()

    return Response(
        content=data,
        media_type="image/x-icon",
        headers={"Cache-Control": "public, max-age=86400"},
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
    "/table-sessions/acquire",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[PublicTableSessionResponseDTO],
)
async def acquire_public_table_session(
    payload: PublicAcquireTableSessionDTO,
    request: Request,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> CreatedResponse[PublicTableSessionResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, payload.tenant_slug)
    table_session = await table_session_service.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=payload.table_number,
        table_ref=payload.table_ref,
        lock_token=payload.lock_token,
        session_id=None,
        client_ip=get_client_ip(request),
        client_fingerprint=_extract_client_fingerprint(request),
    )
    return CreatedResponse(
        message="Table session acquired",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
        ),
    )


@router.post(
    "/table-sessions/refresh",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTableSessionResponseDTO],
)
async def refresh_public_table_session(
    payload: PublicRefreshTableSessionDTO,
    request: Request,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
) -> SuccessResponse[PublicTableSessionResponseDTO]:
    table_session = await table_session_service.refresh_mobile_session(
        session,
        lock_token=payload.lock_token,
        client_ip=get_client_ip(request),
        client_fingerprint=_extract_client_fingerprint(request),
    )
    return SuccessResponse(
        message="Table session refreshed",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
        ),
    )


@router.post(
    "/table-sessions/release",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicTableSessionResponseDTO],
)
async def release_public_table_session(
    payload: PublicReleaseTableSessionDTO,
    session: PostgresSession,
    table_session_service: TableSessionServiceDep,
) -> SuccessResponse[PublicTableSessionResponseDTO]:
    table_session = await table_session_service.release_mobile_session(
        session,
        lock_token=payload.lock_token,
    )
    return SuccessResponse(
        message="Table session released",
        data=_public_table_session_response(
            lock_token=table_session.lock_token,
            expires_at=table_session.expires_at,
            owner_type=table_session.origin.value,
            table_ref=table_session.table_ref,
            table_number=table_session.table_number,
            table_status="released",
            message="released",
        ),
    )


@router.post(
    "/payments/create",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[PublicCreateOrderPaymentResponseDTO],
)
async def create_public_order_payment(
    request: PublicCreateOrderPaymentDTO,
    http_request: Request,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> CreatedResponse[PublicCreateOrderPaymentResponseDTO]:
    tenant = await tenant_service.get_tenant_by_slug(session, request.tenant_slug)
    p24_service.validate_tenant_p24_credentials(tenant)

    total_amount = sum(round(item.unit_price * item.quantity * 100) for item in request.items)
    if total_amount <= 0:
        raise BadRequestError(message="Order total must be greater than zero")

    checkout_session_id = str(uuid4())
    table_session = await table_session_service.acquire_mobile_session(
        session,
        db,
        tenant=tenant,
        table_number=request.table_number,
        table_ref=request.table_ref,
        lock_token=request.lock_token,
        session_id=checkout_session_id,
        client_ip=get_client_ip(http_request),
        client_fingerprint=_extract_client_fingerprint(http_request),
    )

    order_dict: dict[str, Any] = {
        "tableNumber": request.table_number,
        "tableRef": table_session.table_ref,
        "source": "mobile",
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
        session_id=checkout_session_id,
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
        "tableRef": table_session.table_ref,
        "items": order_dict["items"],
        "totalAmount": total_amount,
        "currency": "PLN",
        "email": request.email,
        "status": MONGO_ORDER_STATUS_UNPAID,
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
            lockToken=table_session.lock_token,
            expiresAt=table_session.expires_at.isoformat(),
            tableStatus="locked",
            ownerType=table_session.origin.value,
        ),
    )


@router.post(
    "/payments/sessions/{session_id}/p24-sync",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[PublicP24TransactionSyncResponseDTO],
)
async def sync_public_transaction_from_p24(
    session_id: UUID,
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
) -> SuccessResponse[PublicP24TransactionSyncResponseDTO]:
    result = await session.execute(select(Transaction).where(Transaction.session_id == session_id))
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundResponse(_RESOURCE_TRANSACTION, str(session_id))

    tenant = await tenant_service.get_tenant(session, transaction.tenant_id)
    data, p24_response_code = await p24_service.apply_p24_lookup_to_transaction(
        external_client,
        transaction=transaction,
        tenant=tenant,
    )

    mongo_status = _mongo_order_status_from_transaction(transaction.status)
    await db[_ORDERS_COLLECTION].update_one(
        {"sessionId": str(session_id)},
        {"$set": {"status": mongo_status, "updatedAt": datetime.now(UTC)}},
    )
    if transaction.status in (_TX_STATUS_PAID, _TX_STATUS_ACCEPTED, _TX_STATUS_REFUNDED):
        await table_session_service.mark_completed_by_session_id(
            session,
            session_id=str(session_id),
        )
        await session.flush()

    p24_status_raw = data.get("status")
    if not isinstance(p24_status_raw, int):
        raise BadRequestError(message="Invalid Przelewy24 transaction status")

    return SuccessResponse(
        message="Transaction synced from Przelewy24",
        data=PublicP24TransactionSyncResponseDTO(
            sessionId=str(transaction.session_id),
            status=transaction.status,
            p24OrderId=transaction.p24_order_id,
            amount=transaction.amount,
            currency=transaction.currency,
            p24Status=p24_status_raw,
            responseCode=p24_response_code,
            statement=data.get("statement") if isinstance(data.get("statement"), str) else None,
            date=data.get("date") if isinstance(data.get("date"), str) else None,
            dateOfTransaction=data.get("dateOfTransaction")
            if isinstance(data.get("dateOfTransaction"), str)
            else None,
        ),
    )
