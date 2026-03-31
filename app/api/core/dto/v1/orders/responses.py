from datetime import datetime
from decimal import Decimal

from pydantic import AliasChoices, Field

from core.dto.v1.common import BaseDTO, CurrencyCode, EntityId


class OrderItemResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Item identifier")
    menu_item_id: str = Field(
        ...,
        alias="menuItemId",
        validation_alias=AliasChoices("menuItemId", "menu_item_id", "product_id"),
        description="Menu item identifier",
    )
    name: str = Field(..., description="Item display name")
    quantity: int = Field(..., description="Quantity")
    base_price: Decimal = Field(
        ...,
        ge=0,
        alias="basePrice",
        validation_alias=AliasChoices("basePrice", "base_price", "unit_price"),
        description="Base price",
    )
    selected_modifiers: list[str | dict] = Field(
        default_factory=list,
        alias="selectedModifiers",
        validation_alias=AliasChoices("selectedModifiers", "selected_modifiers", "modifiers"),
        description="Selected modifiers",
    )
    total_price: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        alias="totalPrice",
        validation_alias=AliasChoices("totalPrice", "total_price"),
        description="Total line price",
    )
    notes: str | None = Field(None, description="Item notes")

    @property
    def product_id(self) -> str:
        return self.menu_item_id

    @property
    def modifiers(self) -> list[str | dict]:
        return self.selected_modifiers

    @property
    def unit_price(self) -> Decimal:
        return self.base_price


class OrderResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Order identifier")
    tenant_id: EntityId = Field(..., alias="tenantId", description="Tenant identifier")
    table_id: EntityId | None = Field(None, alias="tableId", description="Table identifier")
    session_id: str = Field(default="", alias="sessionId", description="Session identifier")
    items: list[OrderItemResponseDTO] = Field(default_factory=list, description="Order items")
    status: str = Field(..., description="Order status")
    payment_status: str = Field(
        default="pending", alias="paymentStatus", description="Payment status"
    )
    subtotal: float = Field(default=0, description="Subtotal")
    tax: float = Field(default=0, description="Tax")
    total: float = Field(default=0, description="Total")
    total_amount: Decimal | None = Field(
        None,
        validation_alias=AliasChoices("total_amount", "totalAmount"),
        description="Compatibility total amount field",
    )
    currency: CurrencyCode | None = Field(None, description="Order currency")
    table_number: str = Field(default="", alias="tableNumber", description="Table number")
    floor_canvas_id: str = Field(
        default="", alias="floorCanvasId", description="Floor canvas identifier"
    )
    time: str = Field(default="", description="Order time")
    notes: str | None = Field(None, description="Order notes")
    rejection_reason: str | None = Field(
        None, alias="rejectionReason", description="Rejection reason"
    )
    created_at: datetime | str = Field(..., alias="createdAt", description="Created timestamp")
    updated_at: datetime | str = Field(..., alias="updatedAt", description="Updated timestamp")
