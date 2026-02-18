from decimal import Decimal

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId, PaymentProvider, PaymentStatus


class CreatePaymentDTO(BaseDTO):
    order_id: EntityId = Field(..., description="Order identifier")
    provider: PaymentProvider = Field(..., description="Payment provider")
    amount: Decimal = Field(..., ge=0, description="Payment amount")
    external_reference: str | None = Field(
        None, max_length=255, description="External payment reference"
    )


class UpdatePaymentDTO(BaseDTO):
    status: PaymentStatus | None = Field(None, description="Payment status")
    external_reference: str | None = Field(
        None, max_length=255, description="External payment reference"
    )
