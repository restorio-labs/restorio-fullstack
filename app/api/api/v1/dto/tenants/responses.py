from datetime import datetime

from pydantic import Field

from api.v1.dto.common import BaseDTO, EntityId, TenantStatus


class TenantResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Unique tenant identifier")
    name: str = Field(..., description="Tenant name")
    slug: str = Field(..., description="URL-friendly tenant identifier")
    status: TenantStatus = Field(..., description="Tenant status")
    created_at: datetime = Field(..., description="Timestamp when tenant was created")
