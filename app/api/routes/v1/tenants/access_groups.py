from uuid import UUID

from fastapi import APIRouter, status

from core.authorization.dependencies import (
    AccessGroupAssignTenantId,
    AccessGroupReadTenantId,
    AccessGroupWriteTenantId,
)
from core.authorization.policies import DELEGABLE_ACTIONS
from core.dto.v1.access_groups import (
    AccessGroupOptionsDTO,
    AccessGroupResponseDTO,
    AccessGroupUpsertDTO,
)
from core.foundation.dependencies import PostgresSession
from core.foundation.http.responses import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from services.access_group_service import AccessGroupService

router = APIRouter()
service = AccessGroupService()


@router.get(
    "/{tenant_public_id}/access-groups/options",
    response_model=SuccessResponse[AccessGroupOptionsDTO],
)
async def list_access_group_options(
    _tenant_id: AccessGroupReadTenantId,
) -> SuccessResponse[AccessGroupOptionsDTO]:
    return SuccessResponse(
        message="Delegable capabilities retrieved successfully",
        data=AccessGroupOptionsDTO(
            capabilities=sorted(action.value for action in DELEGABLE_ACTIONS)
        ),
    )


@router.get(
    "/{tenant_public_id}/access-groups",
    response_model=SuccessResponse[list[AccessGroupResponseDTO]],
)
async def list_access_groups(
    tenant_id: AccessGroupReadTenantId,
    session: PostgresSession,
) -> SuccessResponse[list[AccessGroupResponseDTO]]:
    groups = await service.list_groups(session, tenant_id)
    return SuccessResponse(message="Access groups retrieved successfully", data=groups)


@router.post(
    "/{tenant_public_id}/access-groups",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[AccessGroupResponseDTO],
)
async def create_access_group(
    tenant_id: AccessGroupWriteTenantId,
    body: AccessGroupUpsertDTO,
    session: PostgresSession,
) -> CreatedResponse[AccessGroupResponseDTO]:
    group = await service.create_group(session, tenant_id, body)
    return CreatedResponse(message="Access group created successfully", data=group)


@router.put(
    "/{tenant_public_id}/access-groups/{group_id}",
    response_model=UpdatedResponse[AccessGroupResponseDTO],
)
async def update_access_group(
    tenant_id: AccessGroupWriteTenantId,
    group_id: UUID,
    body: AccessGroupUpsertDTO,
    session: PostgresSession,
) -> UpdatedResponse[AccessGroupResponseDTO]:
    group = await service.update_group(session, tenant_id, group_id, body)
    return UpdatedResponse(message="Access group updated successfully", data=group)


@router.delete(
    "/{tenant_public_id}/access-groups/{group_id}",
    response_model=DeletedResponse,
)
async def delete_access_group(
    tenant_id: AccessGroupWriteTenantId,
    group_id: UUID,
    session: PostgresSession,
) -> DeletedResponse:
    await service.delete_group(session, tenant_id, group_id)
    return DeletedResponse(message="Access group deleted successfully")


@router.put(
    "/{tenant_public_id}/access-groups/{group_id}/members/{account_id}",
    response_model=SuccessResponse[dict[str, bool]],
)
async def assign_access_group_member(
    tenant_id: AccessGroupAssignTenantId,
    group_id: UUID,
    account_id: UUID,
    session: PostgresSession,
) -> SuccessResponse[dict[str, bool]]:
    await service.assign_member(session, tenant_id, group_id, account_id)
    return SuccessResponse(message="Employee assigned successfully", data={"assigned": True})


@router.delete(
    "/{tenant_public_id}/access-groups/{group_id}/members/{account_id}",
    response_model=DeletedResponse,
)
async def unassign_access_group_member(
    tenant_id: AccessGroupAssignTenantId,
    group_id: UUID,
    account_id: UUID,
    session: PostgresSession,
) -> DeletedResponse:
    await service.unassign_member(session, tenant_id, group_id, account_id)
    return DeletedResponse(message="Employee unassigned successfully")
