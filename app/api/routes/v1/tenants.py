from uuid import UUID

from fastapi import APIRouter, Request, status

from core.dto.v1 import (
    CreateFloorCanvasDTO,
    CreateTenantDTO,
    FloorCanvasResponseDTO,
    TenantResponseDTO,
    TenantSummaryResponseDTO,
    UpdateFloorCanvasDTO,
    UpdateTenantDTO,
)
from core.foundation.dependencies import (
    FloorCanvasServiceDep,
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


@router.get(
    "/{tenant_id}/canvases",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[FloorCanvasResponseDTO]],
    summary="List floor canvases",
    description="List floor canvases",
    response_description="Floor canvases retrieved successfully",
)
async def list_floor_canvases(
    tenant_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[list[FloorCanvasResponseDTO]]:
    canvases = await service.list_canvases(session, tenant_id)
    return SuccessResponse(
        message="Floor canvases retrieved successfully",
        data=[floor_canvas_to_response(c) for c in canvases],
    )


@router.get(
    "/{tenant_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[FloorCanvasResponseDTO],
    summary="Get a floor canvas by ID",
    description="Get a floor canvas by ID",
    response_description="Floor canvas retrieved successfully",
)
async def get_floor_canvas(
    tenant_id: UUID,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[FloorCanvasResponseDTO]:
    canvas = await service.get_canvas(session, tenant_id, canvas_id)
    return SuccessResponse(
        message="Floor canvas retrieved successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.post(
    "/{tenant_id}/canvases",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[FloorCanvasResponseDTO],
    summary="Create a floor canvas",
    description="Create a floor canvas",
    response_description="Floor canvas created successfully",
)
async def create_floor_canvas(
    tenant_id: UUID,
    request: CreateFloorCanvasDTO,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> CreatedResponse[FloorCanvasResponseDTO]:
    data = CreateFloorCanvasDTO(
        name=request.name,
        width=request.width,
        height=request.height,
        elements=[el.model_dump(by_alias=True, exclude_none=True) for el in request.elements],
    )
    canvas = await service.create_canvas(session, tenant_id, data)
    return CreatedResponse(
        message="Floor canvas created successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.put(
    "/{tenant_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[FloorCanvasResponseDTO],
    response_model_exclude_none=True,
    summary="Update a floor canvas",
    description="Update a floor canvas",
    response_description="Floor canvas updated successfully",
)
async def update_floor_canvas(
    tenant_id: UUID,
    canvas_id: UUID,
    request: UpdateFloorCanvasDTO,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> UpdatedResponse[FloorCanvasResponseDTO]:
    elements = None
    if request.elements is not None:
        elements = [el.model_dump(by_alias=True, exclude_none=True) for el in request.elements]

    data = UpdateFloorCanvasDTO(
        name=request.name,
        width=request.width,
        height=request.height,
        elements=elements,
    )
    canvas = await service.update_canvas(session, tenant_id, canvas_id, data)
    return UpdatedResponse(
        message="Floor canvas updated successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.delete(
    "/{tenant_id}/canvases/{canvas_id}",
    status_code=status.HTTP_200_OK,
    response_model=DeletedResponse,
    summary="Delete a floor canvas",
    description="Delete a floor canvas",
    response_description="Floor canvas deleted successfully",
)
async def delete_floor_canvas(
    tenant_id: UUID,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> DeletedResponse:
    await service.delete_canvas(session, tenant_id, canvas_id)
    return DeletedResponse(message=f"Floor canvas {canvas_id} deleted successfully")


@router.get(
    "/{tenant_id}/canvases/{canvas_id}/versions",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[dict]],
    summary="List canvas versions",
    description="List canvas versions",
    response_description="Canvas versions retrieved successfully",
)
async def list_canvas_versions(
    tenant_id: UUID,
    canvas_id: UUID,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
    limit: int = 50,
) -> SuccessResponse[list[dict]]:
    versions = await service.list_versions(session, tenant_id, canvas_id, limit)
    return SuccessResponse(
        message="Canvas versions retrieved successfully",
        data=versions,
    )


@router.get(
    "/{tenant_id}/canvases/{canvas_id}/versions/{version}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict],
    summary="Get a canvas version by ID",
    description="Get a canvas version by ID",
    response_description="Canvas version retrieved successfully",
)
async def get_canvas_version(
    tenant_id: UUID,
    canvas_id: UUID,
    version: int,
    session: PostgresSession,
    service: FloorCanvasServiceDep,
) -> SuccessResponse[dict]:
    version_data = await service.get_version(session, tenant_id, canvas_id, version)
    return SuccessResponse(
        message="Canvas version retrieved successfully",
        data=version_data,
    )
