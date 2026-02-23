# core/services/tenant_service.py

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.dto.v1.tenants import CreateTenantDTO, UpdateTenantDTO
from core.exceptions import NotFoundResponse
from core.models import Tenant, TenantRole


class TenantService:
    _RESOURCE = "Tenant"

    async def list_tenants(self, session: AsyncSession, user_id: UUID) -> list[Tenant]:
        query = (
            select(Tenant)
            .join(TenantRole, TenantRole.tenant_id == Tenant.id)
            .where(TenantRole.account_id == user_id)
            .options(selectinload(Tenant.floor_canvases))
            .order_by(Tenant.created_at.desc())
        )
        result = await session.execute(query)
        return list(result.scalars().all())

    async def get_tenant(self, session: AsyncSession, tenant_id: UUID) -> Tenant:
        query = (
            select(Tenant)
            .options(selectinload(Tenant.floor_canvases))
            .where(Tenant.id == tenant_id)
        )
        result = await session.execute(query)
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise NotFoundResponse(self._RESOURCE, str(tenant_id))

        return tenant

    async def create_tenant(self, session: AsyncSession, data: CreateTenantDTO) -> Tenant:
        tenant = Tenant(
            name=data.name,
            slug=data.slug,
            status=data.status,
        )
        session.add(tenant)
        await session.commit()
        await session.refresh(tenant, attribute_names=["floor_canvases"])
        return tenant

    async def update_tenant(
        self, session: AsyncSession, tenant_id: UUID, data: UpdateTenantDTO
    ) -> Tenant:
        tenant = await self.get_tenant(session, tenant_id)

        if data.name is not None:
            tenant.name = data.name
        if data.slug is not None:
            tenant.slug = data.slug
        if data.status is not None:
            tenant.status = data.status
        if data.active_layout_version_id is not None:
            tenant.active_layout_version_id = data.active_layout_version_id

        await session.commit()
        await session.refresh(tenant, attribute_names=["floor_canvases"])
        return tenant

    async def delete_tenant(self, session: AsyncSession, tenant_id: UUID) -> None:
        tenant = await self._get_tenant_without_relations(session, tenant_id)
        await session.delete(tenant)
        await session.commit()

    async def _get_tenant_without_relations(self, session: AsyncSession, tenant_id: UUID) -> Tenant:
        query = select(Tenant).where(Tenant.id == tenant_id)
        result = await session.execute(query)
        tenant = result.scalar_one_or_none()

        if not tenant:
            raise NotFoundResponse(self._RESOURCE, str(tenant_id))

        return tenant


tenant_service = TenantService()
