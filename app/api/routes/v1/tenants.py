from fastapi import APIRouter, status

from core.foundation.http.schemas import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)

router = APIRouter()


@router.get("", status_code=status.HTTP_200_OK)
async def list_tenants() -> SuccessResponse[list[dict]]:
    return SuccessResponse[list[dict]](
        message="Tenants retrieved successfully",
        data=[],
    )


@router.get("/{tenant_id}", status_code=status.HTTP_200_OK)
async def get_tenant(tenant_id: str) -> SuccessResponse[dict]:
    return SuccessResponse[dict](
        message=f"Tenant {tenant_id} retrieved successfully",
        data={"id": tenant_id},
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_tenant() -> CreatedResponse[dict]:
    return CreatedResponse[dict](
        message="Tenant created successfully",
        data={"id": "new-tenant-id"},
    )


@router.put("/{tenant_id}", status_code=status.HTTP_200_OK)
async def update_tenant(tenant_id: str) -> UpdatedResponse[dict]:
    return UpdatedResponse[dict](
        message=f"Tenant {tenant_id} updated successfully",
        data={"id": tenant_id},
    )


@router.delete("/{tenant_id}", status_code=status.HTTP_200_OK)
async def delete_tenant(tenant_id: str) -> DeletedResponse:
    return DeletedResponse(
        message=f"Tenant {tenant_id} deleted successfully",
    )
