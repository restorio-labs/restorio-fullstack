from datetime import datetime
from decimal import Decimal

from pydantic import Field

from api.v1.dto.common import BaseDTO, CurrencyCode, EntityId, OrderStatus


class OrderItemResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order item identifier")
    product_id: str = Field(..., description="Product identifier")
    name: str = Field(..., description="Item name snapshot")
    quantity: int = Field(..., description="Item quantity")
    unit_price: Decimal = Field(..., description="Unit price at time of order")


class OrderResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order identifier")
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    table_id: EntityId = Field(..., description="Table identifier")
    status: OrderStatus = Field(..., description="Order status")
    total_amount: Decimal = Field(..., description="Total order amount")
    currency: CurrencyCode = Field(..., description="Currency code (ISO 4217)")
    created_at: datetime = Field(..., description="Timestamp when order was created")
    updated_at: datetime = Field(..., description="Timestamp when order was last updated")
    items: list[OrderItemResponseDTO] = Field(default_factory=list, description="Order items")
