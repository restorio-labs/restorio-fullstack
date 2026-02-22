from uuid import UUID

from fastapi import APIRouter, status

from core.dto.v1.orders import CreateOrderDTO, OrderResponseDTO, UpdateOrderDTO
from core.foundation.http.consts import MSG_NOT_IMPLEMENTED
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)

router = APIRouter()


@router.get(
    "", status_code=status.HTTP_200_OK, response_model=SuccessResponse[list[OrderResponseDTO]]
)
async def list_orders() -> SuccessResponse[list[OrderResponseDTO]]:
    return SuccessResponse[list[OrderResponseDTO]](
        message="Orders retrieved successfully",
        data=[],
    )


@router.get("/{order_id}", status_code=status.HTTP_200_OK)
async def get_order(order_id: UUID) -> SuccessResponse[OrderResponseDTO]:
    raise NotImplementedError(MSG_NOT_IMPLEMENTED)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(request: CreateOrderDTO) -> CreatedResponse[OrderResponseDTO]:
    raise NotImplementedError(MSG_NOT_IMPLEMENTED)


@router.put("/{order_id}", status_code=status.HTTP_200_OK)
async def update_order(
    order_id: UUID, request: UpdateOrderDTO
) -> UpdatedResponse[OrderResponseDTO]:
    raise NotImplementedError(MSG_NOT_IMPLEMENTED)


@router.delete("/{order_id}", status_code=status.HTTP_200_OK)
async def delete_order(order_id: UUID) -> DeletedResponse:
    return DeletedResponse(
        message=f"Order {order_id} deleted successfully",
    )
