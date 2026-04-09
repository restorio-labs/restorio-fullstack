from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Query, Request, status
from sqlalchemy import func, select

from core.dto.v1.orders import (
    ArchivedOrderResponseDTO,
    CreateOrderDTO,
    KitchenOrderResponseDTO,
    UpdateOrderDTO,
    UpdateOrderStatusDTO,
)
from core.exceptions import BadRequestError
from core.foundation.dependencies import (
    AuthorizedTenantId,
    MongoDB,
    OrderServiceDep,
    PostgresSession,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    PaginatedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from core.foundation.role_guard import RequireAnyStaff
from core.models.archived_order import ArchivedOrder
from services.archive_service import ArchiveService
from services.refund_service import RefundService
from services.ws_manager import ws_manager

_archive_service = ArchiveService()
_refund_service = RefundService()

router = APIRouter()


@router.get(
    "/{restaurant_id}/orders",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[KitchenOrderResponseDTO]],
)
async def list_orders(
    restaurant_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
    status_filter: str | None = None,
) -> SuccessResponse[list[KitchenOrderResponseDTO]]:
    orders = await service.list_orders(
        db,
        restaurant_id,
        status=status_filter,
        timezone_name=request.headers.get("X-Timezone"),
    )
    return SuccessResponse(
        message="Orders retrieved successfully",
        data=[KitchenOrderResponseDTO(**o) for o in orders],
    )


@router.get(
    "/{restaurant_id}/orders/archived",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[ArchivedOrderResponseDTO],
)
async def list_archived_orders(
    restaurant_id: str,
    session: PostgresSession,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    since_hours: Annotated[int | None, Query(alias="sinceHours", ge=1)] = 24,
) -> PaginatedResponse[ArchivedOrderResponseDTO]:
    filters = [ArchivedOrder.restaurant_id == restaurant_id]
    if since_hours is not None:
        cutoff = datetime.now(UTC) - timedelta(hours=since_hours)
        filters.append(ArchivedOrder.archived_at >= cutoff)

    total_result = await session.execute(
        select(func.count()).select_from(ArchivedOrder).where(*filters)
    )
    total = int(total_result.scalar_one())
    offset = (page - 1) * page_size

    archived_result = await session.execute(
        select(ArchivedOrder)
        .where(*filters)
        .order_by(ArchivedOrder.archived_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    archived_orders = list(archived_result.scalars().all())

    return PaginatedResponse.create(
        items=[
            ArchivedOrderResponseDTO(
                id=archived.id,
                originalOrderId=archived.original_order_id,
                tenantId=archived.tenant_id,
                restaurantId=archived.restaurant_id,
                tableId=archived.table_id,
                tableLabel=archived.table_label,
                status=archived.status,
                paymentStatus=archived.payment_status,
                total=archived.total,
                currency=archived.currency,
                notes=archived.notes,
                createdAt=archived.order_created_at,
                archivedAt=archived.archived_at,
            )
            for archived in archived_orders
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[KitchenOrderResponseDTO],
)
async def get_order(
    restaurant_id: str,
    order_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[KitchenOrderResponseDTO]:
    order = await service.get_order(
        db,
        restaurant_id,
        order_id,
        timezone_name=request.headers.get("X-Timezone"),
    )
    return SuccessResponse(
        message="Order retrieved successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.post(
    "/{restaurant_id}/orders",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[KitchenOrderResponseDTO],
)
async def create_order(
    restaurant_id: str,
    payload: CreateOrderDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> CreatedResponse[KitchenOrderResponseDTO]:
    data = payload.model_dump(by_alias=True)
    order = await service.create_order(
        db,
        restaurant_id,
        data,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(restaurant_id, {"type": "order_created", "order": order})
    return CreatedResponse(
        message="Order created successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.put(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[KitchenOrderResponseDTO],
)
async def update_order(
    restaurant_id: str,
    order_id: str,
    payload: UpdateOrderDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> UpdatedResponse[KitchenOrderResponseDTO]:
    data = payload.model_dump(by_alias=True, exclude_none=True)
    order = await service.update_order(
        db,
        restaurant_id,
        order_id,
        data,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(restaurant_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order updated successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.patch(
    "/{restaurant_id}/orders/{order_id}/status",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[KitchenOrderResponseDTO],
)
async def update_order_status(
    restaurant_id: str,
    order_id: str,
    payload: UpdateOrderStatusDTO,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> UpdatedResponse[KitchenOrderResponseDTO]:
    order = await service.update_status(
        db,
        restaurant_id,
        order_id,
        payload.status,
        rejection_reason=payload.rejection_reason,
        timezone_name=request.headers.get("X-Timezone"),
    )
    await ws_manager.broadcast(restaurant_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order status updated successfully",
        data=KitchenOrderResponseDTO(**order),
    )


@router.delete(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
)
async def delete_order(
    restaurant_id: str,
    order_id: str,
    request: Request,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> DeletedResponse:
    await service.delete_order(
        db,
        restaurant_id,
        order_id,
        timezone_name=request.headers.get("X-Timezone"),
    )
    return DeletedResponse(message=f"Order {order_id} deleted successfully")


@router.post(
    "/{restaurant_id}/orders/{order_id}/archive",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
)
async def archive_order(
    restaurant_id: str,
    order_id: str,
    db: MongoDB,
    session: PostgresSession,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[dict]:
    order_doc = await service.get_order_for_archive(db, restaurant_id, order_id)
    tenant_id = order_doc.get("restaurantId", restaurant_id)
    archived = await _archive_service.archive_order(
        db, session, tenant_id, restaurant_id, order_doc
    )
    await ws_manager.broadcast(
        restaurant_id,
        {"type": "order_archived", "order": {"id": order_id}},
    )
    return SuccessResponse(
        message="Order archived successfully",
        data={"id": str(archived.id), "originalOrderId": order_id},
    )


@router.post(
    "/{restaurant_id}/orders/{order_id}/refund",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
)
async def refund_order(
    restaurant_id: str,
    order_id: str,
    db: MongoDB,
    service: OrderServiceDep,
    _tenant_id: AuthorizedTenantId,
    _role: RequireAnyStaff,
) -> SuccessResponse[dict]:
    order = await service.get_order(db, restaurant_id, order_id)
    if order["status"] != "rejected":
        msg = "Only rejected orders can be refunded"
        raise BadRequestError(msg)

    refund_result = await _refund_service.process_refund(
        order_id,
        float(order.get("total", 0)),
        order.get("rejectionReason", ""),
    )

    updated = await service.update_status(db, restaurant_id, order_id, "refunded")
    await ws_manager.broadcast(restaurant_id, {"type": "order_updated", "order": updated})

    return SuccessResponse(
        message="Refund initiated successfully",
        data={**refund_result, "order": updated},
    )
