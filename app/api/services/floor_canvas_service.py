from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.dto.v1.floor_canvases import CreateFloorCanvasDTO, UpdateFloorCanvasDTO
from core.exceptions import NotFoundError
from core.models import FloorCanvas, Tenant
from services.canvas_versioning import (
    archive_canvas_version,
    get_canvas_versions,
)
from services.canvas_versioning import (
    get_canvas_version as get_archived_version,
)


class FloorCanvasService:
    _RESOURCE = "Floor canvas"
    _RESOURCE_VERSION = "Canvas version"

    async def list_canvases(self, session: AsyncSession, tenant_id: UUID) -> list[FloorCanvas]:
        await self._ensure_tenant_exists(session, tenant_id)

        query = (
            select(FloorCanvas)
            .where(FloorCanvas.tenant_id == tenant_id)
            .order_by(FloorCanvas.created_at.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_canvas(
        self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID
    ) -> FloorCanvas:
        query = select(FloorCanvas).where(
            FloorCanvas.id == canvas_id,
            FloorCanvas.tenant_id == tenant_id,
        )
        result = await session.execute(query)
        canvas = result.scalar_one_or_none()

        if not canvas:
            raise NotFoundError(self._RESOURCE, str(canvas_id))

        return canvas

    async def create_canvas(
        self, session: AsyncSession, tenant_id: UUID, data: CreateFloorCanvasDTO
    ) -> FloorCanvas:
        await self._ensure_tenant_exists(session, tenant_id)

        canvas = FloorCanvas(
            tenant_id=tenant_id,
            name=data.name,
            width=data.width,
            height=data.height,
            elements=data.elements,
        )
        session.add(canvas)
        await session.commit()
        await session.refresh(canvas)
        return canvas

    async def update_canvas(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        canvas_id: UUID,
        data: UpdateFloorCanvasDTO,
    ) -> FloorCanvas:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)

        if data.elements is not None:
            await archive_canvas_version(canvas)
            canvas.elements = data.elements
            canvas.version += 1

        if data.name is not None:
            canvas.name = data.name
        if data.width is not None:
            canvas.width = data.width
        if data.height is not None:
            canvas.height = data.height

        await session.commit()
        await session.refresh(canvas)
        return canvas

    async def delete_canvas(self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID) -> None:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)
        await session.delete(canvas)
        await session.commit()

    async def list_versions(
        self, session: AsyncSession, tenant_id: UUID, canvas_id: UUID, limit: int = 50
    ) -> list[dict[str, Any]]:
        await self.get_canvas(session, tenant_id, canvas_id)
        return await get_canvas_versions(canvas_id, limit=limit)

    async def get_version(
        self,
        session: AsyncSession,
        tenant_id: UUID,
        canvas_id: UUID,
        version: int,
    ) -> dict[str, Any]:
        canvas = await self.get_canvas(session, tenant_id, canvas_id)

        if canvas.version == version:
            return {
                "id": str(canvas.id),
                "tenant_id": str(canvas.tenant_id),
                "name": canvas.name,
                "width": canvas.width,
                "height": canvas.height,
                "elements": canvas.elements,
                "version": canvas.version,
                "created_at": canvas.created_at.isoformat(),
                "updated_at": canvas.updated_at.isoformat(),
            }

        version_doc = await get_archived_version(canvas_id, version)
        if not version_doc:
            raise NotFoundError(self._RESOURCE_VERSION, f"{canvas_id} v{version}")

        return version_doc

    async def _ensure_tenant_exists(self, session: AsyncSession, tenant_id: UUID) -> None:
        query = select(Tenant.id).where(Tenant.id == tenant_id)
        result = await session.execute(query)
        if not result.scalar_one_or_none():
            resource = "Tenant"
            raise NotFoundError(resource, str(tenant_id))


floor_canvas_service = FloorCanvasService()
