from typing import Any

from pydantic import Field

from core.dto.v1.common import BaseDTO


class PublicTenantInfoResponseDTO(BaseDTO):
    name: str = Field(..., description="Restaurant name")
    slug: str = Field(..., description="Restaurant slug")
    page_title: str | None = Field(None, alias="pageTitle", description="Mobile browser title override")
    favicon_path: str | None = Field(
        None,
        alias="faviconPath",
        description="Relative API path to favicon when configured",
    )
    theme_override: dict[str, Any] | None = Field(
        None, alias="themeOverride", description="Theme CSS variable overrides for mobile"
    )


class PublicCreateOrderPaymentResponseDTO(BaseDTO):
    token: str = Field(..., description="P24 transaction token for redirect")
    redirect_url: str = Field(..., alias="redirectUrl", description="Full P24 redirect URL")
