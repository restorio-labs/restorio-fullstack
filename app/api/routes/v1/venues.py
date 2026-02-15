from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from api.v1.dto.venues import (
    CreateFloorCanvasDTO,
    CreateVenueDTO,
    FloorCanvasResponseDTO,
    UpdateFloorCanvasDTO,
    UpdateVenueDTO,
    VenueResponseDTO,
    VenueSummaryResponseDTO,
)
from core.foundation.dependencies import PostgresSession
from core.foundation.http.schemas import (
    CreatedResponse,
    DeletedResponse,
    SuccessResponse,
    UpdatedResponse,
)
from core.models import FloorCanvas, Venue

router = APIRouter()


def venue_to_response(venue: Venue) -> VenueResponseDTO:
    return VenueResponseDTO(
        id=venue.id,
        tenantId=venue.tenant_id,
        name=venue.name,
        activeLayoutVersionId=venue.active_layout_version_id,
        floorCanvases=[floor_canvas_to_response(fc) for fc in venue.floor_canvases],
        createdAt=venue.created_at,
        updatedAt=venue.updated_at,
    )


def venue_to_summary(venue: Venue) -> VenueSummaryResponseDTO:
    return VenueSummaryResponseDTO(
        id=venue.id,
        tenantId=venue.tenant_id,
        name=venue.name,
        activeLayoutVersionId=venue.active_layout_version_id,
        floorCanvasCount=len(venue.floor_canvases),
        createdAt=venue.created_at,
        updatedAt=venue.updated_at,
    )


def floor_canvas_to_response(canvas: FloorCanvas) -> FloorCanvasResponseDTO:
    return FloorCanvasResponseDTO(
        id=canvas.id,
        venueId=canvas.venue_id,
        name=canvas.name,
        width=canvas.width,
        height=canvas.height,
        elements=canvas.elements,
        version=canvas.version,
        createdAt=canvas.created_at,
        updatedAt=canvas.updated_at,
    )


@router.get("", status_code=status.HTTP_200_OK)
@router.get("/list", status_code=status.HTTP_200_OK)
async def list_venues(
    session: PostgresSession,
    tenant_id: UUID | None = None,
) -> SuccessResponse[list[VenueSummaryResponseDTO]]:
    query = select(Venue).options(selectinload(Venue.floor_canvases))
    if tenant_id:
        query = query.where(Venue.tenant_id == tenant_id)
    query = query.order_by(Venue.created_at.desc())

    result = await session.execute(query)
    venues = result.scalars().all()

    return SuccessResponse[list[VenueSummaryResponseDTO]](
        message="Venues retrieved successfully",
        data=[venue_to_summary(v) for v in venues],
    )


@router.get("/{venue_id}", status_code=status.HTTP_200_OK)
async def get_venue(
    venue_id: UUID,
    session: PostgresSession,
) -> SuccessResponse[VenueResponseDTO]:
    query = select(Venue).options(selectinload(Venue.floor_canvases)).where(Venue.id == venue_id)
    result = await session.execute(query)
    venue = result.scalar_one_or_none()

    if not venue:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    return SuccessResponse[VenueResponseDTO](
        message="Venue retrieved successfully",
        data=venue_to_response(venue),
    )


@router.post("/{tenant_id}", status_code=status.HTTP_201_CREATED)
async def create_venue(
    tenant_id: UUID,
    request: CreateVenueDTO,
    session: PostgresSession,
) -> CreatedResponse[VenueResponseDTO]:
    venue = Venue(
        tenant_id=tenant_id,
        name=request.name,
    )
    session.add(venue)
    await session.commit()
    await session.refresh(venue, attribute_names=["floor_canvases"])

    return CreatedResponse[VenueResponseDTO](
        message="Venue created successfully",
        data=venue_to_response(venue),
    )


@router.put("/{venue_id}", status_code=status.HTTP_200_OK)
async def update_venue(
    venue_id: UUID,
    request: UpdateVenueDTO,
    session: PostgresSession,
) -> UpdatedResponse[VenueResponseDTO]:
    query = select(Venue).options(selectinload(Venue.floor_canvases)).where(Venue.id == venue_id)
    result = await session.execute(query)
    venue = result.scalar_one_or_none()

    if not venue:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    if request.name is not None:
        venue.name = request.name
    if request.active_layout_version_id is not None:
        venue.active_layout_version_id = request.active_layout_version_id

    await session.commit()
    await session.refresh(venue, attribute_names=["floor_canvases"])

    return UpdatedResponse[VenueResponseDTO](
        message="Venue updated successfully",
        data=venue_to_response(venue),
    )


@router.delete("/{venue_id}", status_code=status.HTTP_200_OK)
async def delete_venue(
    venue_id: UUID,
    session: PostgresSession,
) -> DeletedResponse:
    query = select(Venue).where(Venue.id == venue_id)
    result = await session.execute(query)
    venue = result.scalar_one_or_none()

    if not venue:
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    await session.delete(venue)
    await session.commit()

    return DeletedResponse(message=f"Venue {venue_id} deleted successfully")


@router.get("/{venue_id}/canvases", status_code=status.HTTP_200_OK)
async def list_floor_canvases(
    venue_id: UUID,
    session: PostgresSession,
) -> SuccessResponse[list[FloorCanvasResponseDTO]]:
    venue_query = select(Venue).where(Venue.id == venue_id)
    venue_result = await session.execute(venue_query)
    if not venue_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    query = (
        select(FloorCanvas)
        .where(FloorCanvas.venue_id == venue_id)
        .order_by(FloorCanvas.created_at.desc())
    )
    result = await session.execute(query)
    canvases = result.scalars().all()

    return SuccessResponse[list[FloorCanvasResponseDTO]](
        message="Floor canvases retrieved successfully",
        data=[floor_canvas_to_response(c) for c in canvases],
    )


@router.get("/{venue_id}/canvases/{canvas_id}", status_code=status.HTTP_200_OK)
async def get_floor_canvas(
    venue_id: UUID,
    canvas_id: UUID,
    session: PostgresSession,
) -> SuccessResponse[FloorCanvasResponseDTO]:
    query = select(FloorCanvas).where(
        FloorCanvas.id == canvas_id,
        FloorCanvas.venue_id == venue_id,
    )
    result = await session.execute(query)
    canvas = result.scalar_one_or_none()

    if not canvas:
        raise HTTPException(status_code=404, detail=f"Floor canvas {canvas_id} not found")

    return SuccessResponse[FloorCanvasResponseDTO](
        message="Floor canvas retrieved successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.post("/{venue_id}/canvases", status_code=status.HTTP_201_CREATED)
async def create_floor_canvas(
    venue_id: UUID,
    request: CreateFloorCanvasDTO,
    session: PostgresSession,
) -> CreatedResponse[FloorCanvasResponseDTO]:
    venue_query = select(Venue).where(Venue.id == venue_id)
    venue_result = await session.execute(venue_query)
    if not venue_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail=f"Venue {venue_id} not found")

    elements_data = [el.model_dump(by_alias=True, exclude_none=True) for el in request.elements]

    canvas = FloorCanvas(
        venue_id=venue_id,
        name=request.name,
        width=request.width,
        height=request.height,
        elements=elements_data,
    )
    session.add(canvas)
    await session.commit()
    await session.refresh(canvas)

    return CreatedResponse[FloorCanvasResponseDTO](
        message="Floor canvas created successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.put("/{venue_id}/canvases/{canvas_id}", status_code=status.HTTP_200_OK)
async def update_floor_canvas(
    venue_id: UUID,
    canvas_id: UUID,
    request: UpdateFloorCanvasDTO,
    session: PostgresSession,
) -> UpdatedResponse[FloorCanvasResponseDTO]:
    query = select(FloorCanvas).where(
        FloorCanvas.id == canvas_id,
        FloorCanvas.venue_id == venue_id,
    )
    result = await session.execute(query)
    canvas = result.scalar_one_or_none()

    if not canvas:
        raise HTTPException(status_code=404, detail=f"Floor canvas {canvas_id} not found")

    if request.name is not None:
        canvas.name = request.name
    if request.width is not None:
        canvas.width = request.width
    if request.height is not None:
        canvas.height = request.height
    if request.elements is not None:
        canvas.elements = [
            el.model_dump(by_alias=True, exclude_none=True) for el in request.elements
        ]
        canvas.version += 1

    await session.commit()
    await session.refresh(canvas)

    return UpdatedResponse[FloorCanvasResponseDTO](
        message="Floor canvas updated successfully",
        data=floor_canvas_to_response(canvas),
    )


@router.delete("/{venue_id}/canvases/{canvas_id}", status_code=status.HTTP_200_OK)
async def delete_floor_canvas(
    venue_id: UUID,
    canvas_id: UUID,
    session: PostgresSession,
) -> DeletedResponse:
    query = select(FloorCanvas).where(
        FloorCanvas.id == canvas_id,
        FloorCanvas.venue_id == venue_id,
    )
    result = await session.execute(query)
    canvas = result.scalar_one_or_none()

    if not canvas:
        raise HTTPException(status_code=404, detail=f"Floor canvas {canvas_id} not found")

    await session.delete(canvas)
    await session.commit()

    return DeletedResponse(message=f"Floor canvas {canvas_id} deleted successfully")
