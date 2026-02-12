from datetime import datetime
from decimal import Decimal

from pydantic import Field

from api.v1.dto.common import BaseDTO, EntityId, PaymentProvider, PaymentStatus


class PaymentResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Payment identifier")
    order_id: EntityId = Field(..., description="Order identifier")
    provider: PaymentProvider = Field(..., description="Payment provider")
    status: PaymentStatus = Field(..., description="Payment status")
    amount: Decimal = Field(..., description="Payment amount")
    external_reference: str | None = Field(None, description="External payment reference")
    created_at: datetime = Field(..., description="Timestamp when payment was created")
    updated_at: datetime = Field(..., description="Timestamp when payment was last updated")
