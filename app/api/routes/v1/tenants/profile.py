from uuid import UUID

from fastapi import APIRouter, status

from core.dto.v1 import (
    CreateTenantProfileDTO,
    TenantProfileResponseDTO,
)
from core.foundation.dependencies import (
    PostgresSession,
    TenantProfileServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from routes.v1.mappers.tenant_profile_mappers import tenant_profile_to_response

router = APIRouter()


@router.get(
    "/{tenant_id}/profile",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantProfileResponseDTO | None],
    summary="Get tenant profile by tenant ID",
    description="Get tenant profile by tenant ID",
    response_description="Tenant profile retrieved successfully",
)
async def get_tenant_profile(
    tenant_id: UUID,
    session: PostgresSession,
    service: TenantProfileServiceDep,
) -> SuccessResponse[TenantProfileResponseDTO | None]:
    profile = await service.get_by_tenant(session, tenant_id)
    if not profile:
        return SuccessResponse(
            message="Tenant profile not yet created",
            data=None,
        )
    return SuccessResponse(
        message="Tenant profile retrieved successfully",
        data=tenant_profile_to_response(profile),
    )


@router.put(
    "/{tenant_id}/profile",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantProfileResponseDTO]
    | CreatedResponse[TenantProfileResponseDTO],
    summary="Create or update tenant profile",
    description="Create or update tenant profile for a tenant (upsert)",
    response_description="Tenant profile saved successfully",
)
async def upsert_tenant_profile(
    tenant_id: UUID,
    request: CreateTenantProfileDTO,
    session: PostgresSession,
    service: TenantProfileServiceDep,
) -> UpdatedResponse[TenantProfileResponseDTO] | CreatedResponse[TenantProfileResponseDTO]:
    profile, created = await service.upsert(session, tenant_id, request)
    response_data = tenant_profile_to_response(profile)

    if created:
        return CreatedResponse(
            message="Tenant profile created successfully",
            data=response_data,
        )

    return UpdatedResponse(
        message="Tenant profile updated successfully",
        data=response_data,
    )
