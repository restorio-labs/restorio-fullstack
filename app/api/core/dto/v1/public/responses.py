from pydantic import Field

from core.dto.v1.common import BaseDTO


class PublicTenantInfoResponseDTO(BaseDTO):
    name: str = Field(..., description="Restaurant name")
    slug: str = Field(..., description="Restaurant slug")


class PublicCreateOrderPaymentResponseDTO(BaseDTO):
    token: str = Field(..., description="P24 transaction token for redirect")
    redirect_url: str = Field(..., alias="redirectUrl", description="Full P24 redirect URL")
