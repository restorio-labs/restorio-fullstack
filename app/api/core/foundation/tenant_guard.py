from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions.http import ForbiddenError, UnauthorizedError
from core.foundation.database.database import get_db_session
from core.models.tenant import Tenant


def _extract_tenant_public_ids(request: Request) -> list[str]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthorizedError(message="Unauthorized")

    tenant_ids_claim = user.get("tenant_ids")
    if isinstance(tenant_ids_claim, list):
        return [tid for tid in tenant_ids_claim if isinstance(tid, str) and tid]

    tenant_id_claim = user.get("tenant_id")
    if isinstance(tenant_id_claim, str) and tenant_id_claim:
        return [tenant_id_claim]

    return []


async def resolve_and_authorize_tenant(
    tenant_public_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> UUID:
    allowed_ids = _extract_tenant_public_ids(request)
    if not allowed_ids:
        raise ForbiddenError(message="No tenant access")

    if tenant_public_id not in allowed_ids:
        raise ForbiddenError(message="Access denied to this tenant")

    result = await session.execute(select(Tenant.id).where(Tenant.public_id == tenant_public_id))
    tenant_id = result.scalar_one_or_none()

    if tenant_id is None:
        raise ForbiddenError(message="Access denied to this tenant")

    return tenant_id
