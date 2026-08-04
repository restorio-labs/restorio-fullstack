from uuid import UUID

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from core.authorization.actions import AuthorizationAction
from core.authorization.dependencies import authorize_tenant_action
from core.foundation.database.database import get_db_session


async def get_authorized_tenant_uuid(
    session: AsyncSession,
    request: Request,
    tenant_public_id: str,
) -> UUID:
    grant = await authorize_tenant_action(
        action=AuthorizationAction.TENANT_VIEW,
        tenant_public_id=tenant_public_id,
        request=request,
        session=session,
    )
    return grant.tenant_id


async def resolve_and_authorize_tenant(
    tenant_public_id: str,
    request: Request,
    session: AsyncSession = Depends(get_db_session),
) -> UUID:
    return await get_authorized_tenant_uuid(session, request, tenant_public_id)
