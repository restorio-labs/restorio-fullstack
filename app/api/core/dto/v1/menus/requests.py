from decimal import Decimal

from pydantic import Field

from core.dto.v1.common import BaseDTO


class CreateModifierDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Modifier name")
    price: Decimal = Field(..., ge=0, description="Modifier price")


class CreateMenuItemDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Menu item name")
    price: Decimal = Field(..., ge=0, description="Base price")
    description: str | None = Field(None, max_length=1000, description="Item description")
    category: str | None = Field(None, max_length=100, description="Item category")
    is_available: bool = Field(default=True, description="Whether item is currently available")
