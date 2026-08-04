from pydantic import Field

from core.dto.v1.common import BaseDTO


class TenantCapabilitiesDTO(BaseDTO):
    tenant_id: str = Field(..., description="Tenant public ID")
    policy_version: str = Field(..., description="Authorization policy version")
    capabilities: list[str] = Field(..., description="Actions granted for this tenant")
