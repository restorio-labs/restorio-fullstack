from decimal import Decimal

from pydantic import Field

from api.v1.dto.common import BaseDTO


class ModifierDTO(BaseDTO):
    id: str = Field(..., description="Modifier identifier")
    name: str = Field(..., description="Modifier name")
    price: Decimal = Field(..., description="Modifier price")


class MenuItemDTO(BaseDTO):
    id: str = Field(..., description="Menu item identifier")
    name: str = Field(..., description="Menu item name")
    price: Decimal = Field(..., description="Base price")
    description: str | None = Field(None, description="Item description")
    category: str | None = Field(None, description="Item category")
    is_available: bool = Field(..., description="Whether item is currently available")
    modifiers: list[ModifierDTO] = Field(default_factory=list, description="Available modifiers")
