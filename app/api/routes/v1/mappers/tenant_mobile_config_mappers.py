from core.dto.v1.tenants.mobile_config import TenantMobileConfigResponseDTO
from core.models.tenant_mobile_config import TenantMobileConfig


def tenant_mobile_config_to_response(
    row: TenantMobileConfig | None,
) -> TenantMobileConfigResponseDTO:
    if row is None:
        return TenantMobileConfigResponseDTO(
            pageTitle=None,
            themeOverride=None,
            hasFavicon=False,
        )

    return TenantMobileConfigResponseDTO(
        pageTitle=row.page_title,
        themeOverride=row.theme_override,
        hasFavicon=bool(row.favicon_object_key),
    )
