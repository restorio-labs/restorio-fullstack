from pydantic import Field

from core.dto.v1.common import BaseDTO


class MenuItemInputDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Menu item name")
    price: float = Field(..., ge=0, description="Menu item price")
    promoted: int = Field(default=0, ge=0, le=1, description="Promotion flag (0 or 1)")
    desc: str = Field(default="", max_length=2000, description="Menu item description")
    tags: list[str] = Field(default_factory=list, description="Menu item tags")
    is_available: bool = Field(default=True, alias="isAvailable", description="Whether item is currently available")


class MenuCategoryInputDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Category name")
    order: int = Field(..., ge=0, description="Category display order")
    items: list[MenuItemInputDTO] = Field(default_factory=list, description="Category items")


class UpsertTenantMenuDTO(BaseDTO):
    categories: list[MenuCategoryInputDTO] = Field(
        default_factory=list, description="Tenant menu categories"
    )


class ToggleItemAvailabilityDTO(BaseDTO):
    is_available: bool = Field(..., alias="isAvailable", description="Whether item is available")
