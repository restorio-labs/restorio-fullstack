from uuid import UUID

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from core.dto.v1.payments import UpdateP24ConfigDTO
from core.dto.v1.tenants import TenantResponseDTO
from core.foundation.dependencies import PostgresSession
from core.foundation.http.responses import UpdatedResponse
from core.models.tenant import Tenant

router = APIRouter()


def _tenant_to_response(tenant: Tenant) -> TenantResponseDTO:
    return TenantResponseDTO(
        id=tenant.id,
        name=tenant.name,
        slug=tenant.slug,
        status=tenant.status,
        created_at=tenant.created_at,
    )


@router.put("/tenant/{tenant_id}/p24-config", status_code=status.HTTP_200_OK)
async def update_p24_config(
    tenant_id: UUID,
    request: UpdateP24ConfigDTO,
    session: PostgresSession,
) -> UpdatedResponse[TenantResponseDTO]:
    result = await session.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()

    if not tenant:
        raise HTTPException(status_code=404, detail=f"Tenant {tenant_id} not found")

    tenant.p24_merchantid = request.p24_merchantid
    tenant.p24_api = request.p24_api
    tenant.p24_crc = request.p24_crc

    await session.commit()
    await session.refresh(tenant)

    return UpdatedResponse[TenantResponseDTO](
        message="P24 config updated successfully",
        data=_tenant_to_response(tenant),
    )
