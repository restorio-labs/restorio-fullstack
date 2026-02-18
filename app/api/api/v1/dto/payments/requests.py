from decimal import Decimal

from pydantic import Field

from api.v1.dto.common import BaseDTO, EntityId, PaymentProvider, PaymentStatus


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


class UpdateP24ConfigDTO(BaseDTO):
    p24_merchantid: int = Field(
        ..., ge=0, le=999_999, description="Przelewy24 merchant ID (max 6 digits)"
    )
    p24_api: str = Field(..., max_length=32, description="Przelewy24 API key")
    p24_crc: str = Field(..., max_length=16, description="Przelewy24 CRC key")
