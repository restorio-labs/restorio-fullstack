from uuid import UUID

from fastapi import APIRouter, status

from api.v1.dto.tenants import CreateTenantDTO, TenantResponseDTO, UpdateTenantDTO
from core.foundation.http.schemas import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def list_tenants() -> SuccessResponse[list[TenantResponseDTO]]:
    return SuccessResponse[list[TenantResponseDTO]](
        message="Tenants retrieved successfully",
        data=[],
    )


@router.get("/{tenant_id}", status_code=status.HTTP_200_OK)
async def get_tenant(tenant_id: UUID) -> SuccessResponse[TenantResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_tenant(request: CreateTenantDTO) -> CreatedResponse[TenantResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.put("/{tenant_id}", status_code=status.HTTP_200_OK)
async def update_tenant(tenant_id: UUID, request: UpdateTenantDTO) -> UpdatedResponse[TenantResponseDTO]:
    raise NotImplementedError("Endpoint to be implemented")


@router.delete("/{tenant_id}", status_code=status.HTTP_200_OK)
async def delete_tenant(tenant_id: UUID) -> DeletedResponse:
    return DeletedResponse(
        message=f"Tenant {tenant_id} deleted successfully",
    )
