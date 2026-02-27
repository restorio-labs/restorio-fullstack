from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import Field

from core.dto.v1.common import BaseDTO, EntityId, PaymentProvider, PaymentStatus


class PaymentResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Payment identifier")
    order_id: EntityId = Field(..., description="Order identifier")
    provider: PaymentProvider = Field(..., description="Payment provider")
    status: PaymentStatus = Field(..., description="Payment status")
    amount: Decimal = Field(..., description="Payment amount")
    external_reference: str | None = Field(None, description="External payment reference")
    created_at: datetime = Field(..., description="Timestamp when payment was created")
    updated_at: datetime = Field(..., description="Timestamp when payment was last updated")


class TransactionListItemDTO(BaseDTO):
    session_id: UUID
    p24_order_id: int | None
    amount: int
    email: str
    status: int
    description: str
    order: dict[str, Any] | None
    note: str | None
    created_at: datetime
