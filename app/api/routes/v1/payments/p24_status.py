from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Form, status
from sqlalchemy import select

from core.constants import KITCHEN_ORDERS_COLLECTION, ORDERS_COLLECTION
from core.exceptions import BadRequestError, NotFoundResponse
from core.foundation.dependencies import (
    ExternalClientDep,
    MongoDB,
    P24ServiceDep,
    PostgresSession,
    TableSessionServiceDep,
    TenantServiceDep,
)
from core.foundation.http.responses import SuccessResponse
from core.models.transaction import Transaction
from services.payment_service import (
    MONGO_PAYMENT_STATUS_COMPLETED,
    TX_STATUS_ACCEPTED,
    TX_STATUS_PAID,
    TX_STATUS_REFUNDED,
    mongo_payment_status_from_transaction,
)

router = APIRouter()

MONGO_ORDER_STATUS_NEW = "new"

_RESOURCE_TRANSACTION = "Transaction"


@router.post(
    "/status",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, Any]],
)
async def p24_status_webhook(
    session: PostgresSession,
    tenant_service: TenantServiceDep,
    p24_service: P24ServiceDep,
    external_client: ExternalClientDep,
    table_session_service: TableSessionServiceDep,
    db: MongoDB,
    merchantId: int = Form(...),  # noqa: N803, ARG001
    posId: int = Form(...),  # noqa: N803, ARG001
    sessionId: str = Form(...),  # noqa: N803
    amount: int = Form(...),
    originAmount: int = Form(...),  # noqa: N803, ARG001
    currency: str = Form(...),  # noqa: ARG001
    orderId: int = Form(...),  # noqa: N803, ARG001
    methodId: int = Form(...),  # noqa: N803, ARG001
    statement: str = Form(...),  # noqa: ARG001
    sign: str = Form(...),  # noqa: ARG001
) -> SuccessResponse[dict[str, Any]]:
    result = await session.execute(
        select(Transaction).where(Transaction.session_id == sessionId)
    )
    transaction = result.scalar_one_or_none()
    if transaction is None:
        raise NotFoundResponse(_RESOURCE_TRANSACTION, sessionId)

    if transaction.amount != amount:
        raise BadRequestError(message="Transaction amount mismatch")

    tenant = await tenant_service.get_tenant(session, transaction.tenant_id)

    _data, _response_code = await p24_service.apply_p24_lookup_to_transaction(
        external_client,
        transaction=transaction,
        tenant=tenant,
    )

    payment_status = mongo_payment_status_from_transaction(transaction.status)
    now = datetime.now(UTC)

    mobile_order = await db[ORDERS_COLLECTION].find_one({"sessionId": sessionId})

    await db[ORDERS_COLLECTION].update_one(
        {"sessionId": sessionId},
        {"$set": {"paymentStatus": payment_status, "updatedAt": now}},
    )

    if transaction.status in (TX_STATUS_PAID, TX_STATUS_ACCEPTED):
        if mobile_order is not None:
            kitchen_order: dict[str, Any] = {
                "_id": f"M-{sessionId[:8].upper()}",
                "restaurantId": tenant.public_id,
                "tableId": mobile_order.get("tableRef"),
                "sessionId": sessionId,
                "items": [
                    {
                        "id": f"item-{i}",
                        "menuItemId": "",
                        "name": item.get("name", ""),
                        "quantity": item.get("quantity", 1),
                        "basePrice": float(item.get("unitPrice", 0)),
                        "selectedModifiers": [],
                        "totalPrice": float(item.get("unitPrice", 0)) * item.get("quantity", 1),
                    }
                    for i, item in enumerate(mobile_order.get("items", []))
                ],
                "status": MONGO_ORDER_STATUS_NEW,
                "paymentStatus": MONGO_PAYMENT_STATUS_COMPLETED,
                "subtotal": mobile_order.get("totalAmount", 0) / 100,
                "tax": 0,
                "total": mobile_order.get("totalAmount", 0) / 100,
                "table": f"Stolik {mobile_order.get('tableNumber', '?')}",
                "time": now.strftime("%H:%M"),
                "notes": mobile_order.get("note"),
                "rejectionReason": None,
                "createdAt": now,
                "updatedAt": now,
                "source": "mobile",
                "mobileOrderId": str(mobile_order.get("_id")),
            }
            await db[KITCHEN_ORDERS_COLLECTION].insert_one(kitchen_order)

        await table_session_service.mark_completed_by_session_id(
            session,
            session_id=sessionId,
        )

    if transaction.status == TX_STATUS_REFUNDED:
        await table_session_service.mark_completed_by_session_id(
            session,
            session_id=sessionId,
        )

    await session.commit()

    return SuccessResponse(
        message="Payment status received",
        data={"sessionId": sessionId, "status": transaction.status},
    )
