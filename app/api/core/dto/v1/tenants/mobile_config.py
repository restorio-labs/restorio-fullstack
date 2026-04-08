from typing import Any

from pydantic import Field, field_validator

from core.dto.v1.common import BaseDTO


class TenantMobileConfigResponseDTO(BaseDTO):
    page_title: str | None = Field(None, alias="pageTitle")
    theme_override: dict[str, Any] | None = Field(None, alias="themeOverride")
    has_favicon: bool = Field(False, alias="hasFavicon")


class UpdateTenantMobileConfigDTO(BaseDTO):
    page_title: str | None = Field(None, max_length=255, alias="pageTitle")
    theme_override: dict[str, Any] | None = Field(None, alias="themeOverride")

    @field_validator("theme_override")
    @classmethod
    def validate_theme_size(cls, v: dict[str, Any] | None) -> dict[str, Any] | None:
        if v is None:
            return v
        raw = str(v)
        if len(raw) > 131072:
            raise ValueError("Theme override is too large")
        return v


class TenantMobileFaviconPresignRequestDTO(BaseDTO):
    content_type: str = Field(..., alias="contentType")


class TenantMobileFaviconPresignResponseDTO(BaseDTO):
    upload_url: str = Field(..., alias="uploadUrl")
    object_key: str = Field(..., alias="objectKey")


class TenantMobileFaviconFinalizeRequestDTO(BaseDTO):
    object_key: str = Field(..., alias="objectKey")


class CopyMobileThemeFromDTO(BaseDTO):
    source_tenant_public_id: str = Field(..., min_length=1, alias="sourceTenantPublicId")


class MenuImagePresignRequestDTO(BaseDTO):
    content_type: str = Field(..., alias="contentType")


class MenuImagePresignResponseDTO(BaseDTO):
    upload_url: str = Field(..., alias="uploadUrl")
    object_key: str = Field(..., alias="objectKey")


class MenuImageFinalizeRequestDTO(BaseDTO):
    object_key: str = Field(..., alias="objectKey")


class MenuImageFinalizeResponseDTO(BaseDTO):
    image_url: str = Field(..., alias="imageUrl")
