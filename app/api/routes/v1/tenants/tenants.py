from uuid import UUID

from fastapi import APIRouter, Request, status

from core.dto.v1 import (
    CreateTenantDTO,
    TenantResponseDTO,
    TenantSummaryResponseDTO,
    UpdateTenantDTO,
)
from core.foundation.dependencies import (
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UnauthenticatedResponse,
    UpdatedResponse,
)
from routes.v1.mappers.tenant_mappers import (
    floor_canvas_to_response,
    tenant_to_response,
    tenant_to_summary,
)

router = APIRouter()


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[TenantSummaryResponseDTO]],
)
async def list_tenants(
    request: Request,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[list[TenantSummaryResponseDTO]]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    subject = user.get("sub")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    user_id = UUID(subject)
    tenants = await service.list_tenants(session, user_id)
    return SuccessResponse(
        message="Tenants retrieved successfully",
        data=[tenant_to_summary(t) for t in tenants],
    )


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[TenantResponseDTO],
)
async def create_tenant(
    request: CreateTenantDTO,
    session: PostgresSession,
    service: TenantServiceDep,
) -> CreatedResponse[TenantResponseDTO]:
    data = CreateTenantDTO(
        name=request.name,
        slug=request.slug,
        status=request.status,
    )
    tenant = await service.create_tenant(session, data)
    return CreatedResponse(
        message="Tenant created successfully",
        data=tenant_to_response(tenant),
    )


@router.get(
    "/{tenant_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantResponseDTO],
    summary="Get a tenant by ID",
    description="Get a tenant by ID",
    response_description="Tenant retrieved successfully",
)
async def get_tenant(
    tenant_id: UUID,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[TenantResponseDTO]:
    tenant = await service.get_tenant(session, tenant_id)
    return SuccessResponse(
        message="Tenant retrieved successfully",
        data=tenant_to_response(tenant),
    )


@router.put(
    "/{tenant_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantResponseDTO],
    summary="Update a tenant",
    description="Update a tenant",
    response_description="Tenant updated successfully",
)
async def update_tenant(
    tenant_id: UUID,
    request: UpdateTenantDTO,
    session: PostgresSession,
    service: TenantServiceDep,
) -> UpdatedResponse[TenantResponseDTO]:
    data = UpdateTenantDTO(
        name=request.name,
        slug=request.slug,
        status=request.status,
        active_layout_version_id=request.active_layout_version_id,
    )
    tenant = await service.update_tenant(session, tenant_id, data)
    return UpdatedResponse(
        message="Tenant updated successfully",
        data=tenant_to_response(tenant),
    )


@router.delete(
    "/{tenant_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
    summary="Delete a tenant",
    description="Delete a tenant",
    response_description="Tenant deleted successfully",
)
async def delete_tenant(
    tenant_id: UUID,
    session: PostgresSession,
    service: TenantServiceDep,
) -> DeletedResponse:
    await service.delete_tenant(session, tenant_id)
    return DeletedResponse(message=f"Tenant {tenant_id} deleted successfully")

