from pydantic import Field

from core.dto.v1.common import BaseDTO


class CreateOrderItemDTO(BaseDTO):
    id: str = Field(default="", description="Item identifier")
    menu_item_id: str = Field(..., min_length=1, alias="menuItemId", description="Menu item identifier")
    name: str = Field(..., min_length=1, description="Item display name")
    quantity: int = Field(..., gt=0, description="Item quantity")
    base_price: float = Field(..., ge=0, alias="basePrice", description="Base unit price")
    selected_modifiers: list[dict] = Field(
        default_factory=list, alias="selectedModifiers", description="Selected modifiers"
    )
    total_price: float = Field(..., ge=0, alias="totalPrice", description="Total line price")
    notes: str | None = Field(None, description="Item notes")


class CreateOrderDTO(BaseDTO):
    table_id: str | None = Field(None, alias="tableId", description="Table identifier")
    session_id: str = Field(default="", alias="sessionId", description="Session identifier")
    table: str = Field(default="", description="Table label")
    items: list[CreateOrderItemDTO] = Field(..., min_length=1, description="Order items")
    subtotal: float = Field(default=0, ge=0, description="Subtotal")
    tax: float = Field(default=0, ge=0, description="Tax amount")
    total: float = Field(default=0, ge=0, description="Total amount")
    notes: str | None = Field(None, description="Order notes")
    payment_status: str = Field(default="completed", alias="paymentStatus", description="Payment status")


class UpdateOrderStatusDTO(BaseDTO):
    status: str = Field(..., description="Target order status")
    rejection_reason: str | None = Field(
        None, alias="rejectionReason", description="Reason for rejection (required when status is 'rejected')"
    )
