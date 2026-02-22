from decimal import Decimal

from pydantic import Field

from core.dto.v1.common import BaseDTO, CurrencyCode, EntityId, OrderStatus


class CreateOrderItemDTO(BaseDTO):
    product_id: str = Field(..., min_length=1, description="Product identifier")
    quantity: int = Field(..., gt=0, description="Item quantity")
    modifiers: list[str] = Field(default_factory=list, description="List of modifier IDs")


class CreateOrderDTO(BaseDTO):
    table_id: EntityId = Field(..., description="Restaurant table identifier")
    items: list[CreateOrderItemDTO] = Field(..., min_length=1, description="Order items")


class UpdateOrderDTO(BaseDTO):
    status: OrderStatus | None = Field(None, description="Order status")
    total_amount: Decimal | None = Field(None, ge=0, description="Total order amount")
    currency: CurrencyCode | None = Field(None, description="Currency code (ISO 4217)")
