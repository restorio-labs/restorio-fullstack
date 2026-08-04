from fastapi import APIRouter, Request, status

from core.authorization.actions import AuthorizationAction
from core.authorization.dependencies import (
    TenantCreateAccountId,
    TenantDeleteId,
    TenantListAccountId,
    TenantUpdateId,
    TenantViewId,
    authorize_tenant_action,
)
from core.authorization.engine import authorization_engine
from core.dto.v1 import (
    CreateTenantDTO,
    TenantResponseDTO,
    TenantSummaryResponseDTO,
    UpdateTenantDTO,
)
from core.dto.v1.authorization import TenantCapabilitiesDTO
from core.foundation.dependencies import (
    PostgresSession,
    TenantServiceDep,
)
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from routes.v1.mappers.tenant_mappers import (
    tenant_to_response,
    tenant_to_summary,
)

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[TenantSummaryResponseDTO]],
)
async def list_tenants(
    user_id: TenantListAccountId,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[list[TenantSummaryResponseDTO]]:
    tenants = await service.list_tenants(session, user_id)
    return SuccessResponse(
        message="Tenants retrieved successfully",
        data=[tenant_to_summary(t) for t in tenants],
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[TenantResponseDTO],
)
async def create_tenant(
    user_id: TenantCreateAccountId,
    body: CreateTenantDTO,
    session: PostgresSession,
    service: TenantServiceDep,
) -> CreatedResponse[TenantResponseDTO]:
    data = CreateTenantDTO(
        name=body.name,
        slug=body.slug,
        status=body.status,
    )
    tenant = await service.create_tenant(session, data, user_id)

    return CreatedResponse(
        message="Tenant created successfully",
        data=tenant_to_response(tenant),
    )


@router.get(
    "/{tenant_public_id}/capabilities",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantCapabilitiesDTO],
)
async def get_tenant_capabilities(
    tenant_public_id: str,
    request: Request,
    session: PostgresSession,
) -> SuccessResponse[TenantCapabilitiesDTO]:
    grant = await authorize_tenant_action(
        action=AuthorizationAction.TENANT_VIEW,
        tenant_public_id=tenant_public_id,
        request=request,
        session=session,
    )
    capabilities = authorization_engine.capabilities(
        subject=grant.subject,
        resource=grant.resource,
        environment=grant.environment,
    )
    return SuccessResponse(
        message="Tenant capabilities retrieved successfully",
        data=TenantCapabilitiesDTO(
            tenant_id=tenant_public_id,
            policy_version=authorization_engine.policy_version,
            capabilities=sorted(action.value for action in capabilities),
        ),
    )


@router.get(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantResponseDTO],
    summary="Get a tenant by ID",
    description="Get a tenant by ID",
    response_description="Tenant retrieved successfully",
)
async def get_tenant(
    tenant_id: TenantViewId,
    session: PostgresSession,
    service: TenantServiceDep,
) -> SuccessResponse[TenantResponseDTO]:
    tenant = await service.get_tenant(session, tenant_id)
    return SuccessResponse(
        message="Tenant retrieved successfully",
        data=tenant_to_response(tenant),
    )


@router.put(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantResponseDTO],
    summary="Update a tenant",
    description="Update a tenant",
    response_description="Tenant updated successfully",
)
async def update_tenant(
    tenant_id: TenantUpdateId,
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
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
    summary="Delete a tenant",
    description="Delete a tenant",
    response_description="Tenant deleted successfully",
)
async def delete_tenant(
    tenant_id: TenantDeleteId,
    session: PostgresSession,
    service: TenantServiceDep,
) -> DeletedResponse:
    await service.delete_tenant(session, tenant_id)
    return DeletedResponse(message="Tenant deleted successfully")
