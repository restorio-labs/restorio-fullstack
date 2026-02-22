from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from core.models import Tenant


class TenantRepository:
    async def find_by_id(self, session: AsyncSession, id: UUID) -> Tenant | None:
        pass

    async def find_by_id_with_canvases(self, session: AsyncSession, id: UUID) -> Tenant | None:
        pass

    async def find_all(self, session: AsyncSession) -> list[Tenant]:
        pass

    async def save(self, session: AsyncSession, tenant: Tenant) -> Tenant:
        pass

    async def delete(self, session: AsyncSession, tenant: Tenant) -> None:
        pass

    async def create(self, session: AsyncSession, tenant: Tenant) -> Tenant:
        pass

    async def update(self, session: AsyncSession, tenant: Tenant) -> Tenant:
        pass
