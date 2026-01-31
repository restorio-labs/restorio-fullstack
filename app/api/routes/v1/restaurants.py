from uuid import UUID

from fastapi import APIRouter, status

from api.v1.dto.restaurants import (
    CreateRestaurantTableDTO,
    RestaurantTableResponseDTO,
    UpdateRestaurantTableDTO,
)
from core.foundation.http.schemas import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)

router = APIRouter()


@router.get("/tables", status_code=status.HTTP_200_OK)
async def list_restaurant_tables() -> SuccessResponse[list[RestaurantTableResponseDTO]]:
    return SuccessResponse[list[RestaurantTableResponseDTO]](
        message="Restaurant tables retrieved successfully",
        data=[],
    )


@router.get("/tables/{table_id}", status_code=status.HTTP_200_OK)
async def get_restaurant_table(table_id: UUID) -> SuccessResponse[RestaurantTableResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.post("/tables", status_code=status.HTTP_201_CREATED)
async def create_restaurant_table(request: CreateRestaurantTableDTO) -> CreatedResponse[RestaurantTableResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.put("/tables/{table_id}", status_code=status.HTTP_200_OK)
async def update_restaurant_table(table_id: UUID, request: UpdateRestaurantTableDTO) -> UpdatedResponse[RestaurantTableResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.delete("/tables/{table_id}", status_code=status.HTTP_200_OK)
async def delete_restaurant_table(table_id: UUID) -> DeletedResponse:
    return DeletedResponse(
        message=f"Restaurant table {table_id} deleted successfully",
    )
