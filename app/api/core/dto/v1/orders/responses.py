from datetime import datetime
from decimal import Decimal

from pydantic import Field

from core.dto.v1.common import BaseDTO, CurrencyCode, EntityId, OrderStatus


class OrderItemResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order item identifier")
    product_id: str = Field(..., description="Product identifier")
    name: str = Field(..., description="Item name snapshot")
    quantity: int = Field(..., description="Item quantity")
    unit_price: Decimal = Field(..., description="Unit price at time of order")


class OrderResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order identifier")
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    table_id: EntityId | None = Field(None, description="Table identifier")
    table_ref: str | None = Field(None, description="Client table identifier from floor layout")
    waiter_name: str | None = Field(None, description="Assigned waiter name")
    waiter_surname: str | None = Field(None, description="Assigned waiter surname")
    status: OrderStatus = Field(..., description="Order status")
    total_amount: Decimal = Field(..., description="Total order amount")
    currency: CurrencyCode = Field(..., description="Currency code (ISO 4217)")
    created_at: datetime = Field(..., description="Timestamp when order was created")
    updated_at: datetime = Field(..., description="Timestamp when order was last updated")
    items: list[OrderItemResponseDTO] = Field(default_factory=list, description="Order items")
