from datetime import datetime
from typing import Any

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId


class MenuItemDTO(BaseDTO):
    name: str = Field(..., description="Menu item name")
    price: float = Field(..., description="Menu item price")
    promoted: int = Field(..., description="Promotion flag (0 or 1)")
    desc: str = Field(..., description="Menu item description")
    tags: list[str] = Field(default_factory=list, description="Menu item tags")


class MenuCategoryDTO(BaseDTO):
    name: str = Field(..., description="Category name")
    order: int = Field(..., description="Category display order")
    items: list[MenuItemDTO] = Field(default_factory=list, description="Category items")


class TenantMenuResponseDTO(BaseDTO):
    tenant_id: EntityId = Field(..., alias="tenantId", serialization_alias="tenantId")
    tenant_id_legacy: str = Field(..., alias="tenantID", serialization_alias="tenantID")
    menu: dict[str, dict[str, Any]] = Field(..., description="Raw menu payload stored in MongoDB")
    categories: list[MenuCategoryDTO] = Field(
        default_factory=list, description="Normalized category view"
    )
    updated_at: datetime | None = Field(None, alias="updatedAt", serialization_alias="updatedAt")
