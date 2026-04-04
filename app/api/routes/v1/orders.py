from fastapi import APIRouter, status

from core.dto.v1.orders import CreateOrderDTO, OrderResponseDTO, UpdateOrderDTO, UpdateOrderStatusDTO
from core.exceptions import BadRequestError
from core.foundation.dependencies import MongoDB, OrderServiceDep, PostgresSession
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from services.archive_service import ArchiveService
from services.refund_service import RefundService
from services.ws_manager import ws_manager

_archive_service = ArchiveService()
_refund_service = RefundService()

router = APIRouter()


@router.get(
    "/{restaurant_id}/orders",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[OrderResponseDTO]],
)
async def list_orders(
    restaurant_id: str,
    db: MongoDB,
    service: OrderServiceDep,
    status_filter: str | None = None,
) -> SuccessResponse[list[OrderResponseDTO]]:
    orders = await service.list_orders(db, restaurant_id, status=status_filter)
    return SuccessResponse(
        message="Orders retrieved successfully",
        data=[OrderResponseDTO(**o) for o in orders],
    )


@router.get(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[OrderResponseDTO],
)
async def get_order(
    restaurant_id: str,
    order_id: str,
    db: MongoDB,
    service: OrderServiceDep,
) -> SuccessResponse[OrderResponseDTO]:
    order = await service.get_order(db, restaurant_id, order_id)
    return SuccessResponse(
        message="Order retrieved successfully",
        data=OrderResponseDTO(**order),
    )


@router.post(
    "/{restaurant_id}/orders",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[OrderResponseDTO],
)
async def create_order(
    restaurant_id: str,
    payload: CreateOrderDTO,
    db: MongoDB,
    service: OrderServiceDep,
) -> CreatedResponse[OrderResponseDTO]:
    data = payload.model_dump(by_alias=True)
    order = await service.create_order(db, restaurant_id, data)
    await ws_manager.broadcast(restaurant_id, {"type": "order_created", "order": order})
    return CreatedResponse(
        message="Order created successfully",
        data=OrderResponseDTO(**order),
    )


@router.put(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[OrderResponseDTO],
)
async def update_order(
    restaurant_id: str,
    order_id: str,
    payload: UpdateOrderDTO,
    db: MongoDB,
    service: OrderServiceDep,
) -> UpdatedResponse[OrderResponseDTO]:
    data = payload.model_dump(by_alias=True, exclude_none=True)
    order = await service.update_order(db, restaurant_id, order_id, data)
    await ws_manager.broadcast(restaurant_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order updated successfully",
        data=OrderResponseDTO(**order),
    )


@router.patch(
    "/{restaurant_id}/orders/{order_id}/status",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[OrderResponseDTO],
)
async def update_order_status(
    restaurant_id: str,
    order_id: str,
    payload: UpdateOrderStatusDTO,
    db: MongoDB,
    service: OrderServiceDep,
) -> UpdatedResponse[OrderResponseDTO]:
    order = await service.update_status(
        db,
        restaurant_id,
        order_id,
        payload.status,
        rejection_reason=payload.rejection_reason,
    )
    await ws_manager.broadcast(restaurant_id, {"type": "order_updated", "order": order})
    return UpdatedResponse(
        message="Order status updated successfully",
        data=OrderResponseDTO(**order),
    )


@router.delete(
    "/{restaurant_id}/orders/{order_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
)
async def delete_order(
    restaurant_id: str,
    order_id: str,
    db: MongoDB,
    service: OrderServiceDep,
) -> DeletedResponse:
    await service.delete_order(db, restaurant_id, order_id)
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
