from pydantic import Field

from core.dto.v1.common import BaseDTO


class OrderItemResponseDTO(BaseDTO):
    id: str = Field(..., description="Item identifier")
    menu_item_id: str = Field(..., alias="menuItemId", description="Menu item identifier")
    name: str = Field(..., description="Item display name")
    quantity: int = Field(..., description="Quantity")
    base_price: float = Field(..., alias="basePrice", description="Base price")
    selected_modifiers: list[dict] = Field(
        default_factory=list, alias="selectedModifiers", description="Selected modifiers"
    )
    total_price: float = Field(..., alias="totalPrice", description="Total line price")
    notes: str | None = Field(None, description="Item notes")


class OrderResponseDTO(BaseDTO):
    id: str = Field(..., description="Order identifier")
    restaurant_id: str = Field(..., alias="restaurantId", description="Restaurant identifier")
    table_id: str | None = Field(None, alias="tableId", description="Table identifier")
    session_id: str = Field(default="", alias="sessionId", description="Session identifier")
    items: list[OrderItemResponseDTO] = Field(default_factory=list, description="Order items")
    status: str = Field(..., description="Order status")
    payment_status: str = Field(default="pending", alias="paymentStatus", description="Payment status")
    subtotal: float = Field(default=0, description="Subtotal")
    tax: float = Field(default=0, description="Tax")
    total: float = Field(default=0, description="Total")
    table: str = Field(default="", description="Table label")
    time: str = Field(default="", description="Order time")
    notes: str | None = Field(None, description="Order notes")
    rejection_reason: str | None = Field(None, alias="rejectionReason", description="Rejection reason")
    created_at: str = Field(..., alias="createdAt", description="Created timestamp")
    updated_at: str = Field(..., alias="updatedAt", description="Updated timestamp")
