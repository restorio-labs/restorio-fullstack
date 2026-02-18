from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId, TenantStatus


class CreateTenantDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Tenant name")
    slug: str = Field(
        ...,
        min_length=1,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="URL-friendly tenant identifier",
    )
    status: TenantStatus = Field(default=TenantStatus.ACTIVE, description="Tenant status")


class UpdateTenantDTO(BaseDTO):
    name: str | None = Field(None, min_length=1, max_length=255, description="Tenant name")
    slug: str | None = Field(
        None,
        min_length=1,
        max_length=100,
        pattern="^[a-z0-9-]+$",
        description="URL-friendly tenant identifier",
    )
    status: TenantStatus | None = Field(None, description="Tenant status")
    active_layout_version_id: EntityId | None = Field(
        None, alias="activeLayoutVersionId", description="Active floor canvas id"
    )
