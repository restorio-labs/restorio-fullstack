from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from core.models.enums import (
    AccountType,
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
    TenantStatus,
)


class Tenant(BaseModel):
    id: UUID
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=100)
    status: TenantStatus = TenantStatus.ACTIVE
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TenantCreate(BaseModel):
    name: str = Field(..., max_length=255)
    slug: str = Field(..., max_length=100)
    status: TenantStatus = TenantStatus.ACTIVE


class User(BaseModel):
    id: UUID
    email: EmailStr
    account_type: AccountType = AccountType.OWNER
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    email: EmailStr
    password_hash: str
    account_type: AccountType = AccountType.OWNER
    is_active: bool = True


class RestaurantTable(BaseModel):
    id: UUID
    tenant_id: UUID
    label: str = Field(..., max_length=50)
    capacity: int = Field(..., gt=0)
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RestaurantTableCreate(BaseModel):
    tenant_id: UUID
    label: str = Field(..., max_length=50)
    capacity: int = Field(..., gt=0)
    is_active: bool = True


class Order(BaseModel):
    id: UUID
    tenant_id: UUID
    table_id: UUID
    status: OrderStatus = OrderStatus.PLACED
    total_amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field(default="PLN", max_length=3)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderCreate(BaseModel):
    tenant_id: UUID
    table_id: UUID
    status: OrderStatus = OrderStatus.PLACED
    total_amount: Decimal = Field(..., ge=0, decimal_places=2)
    currency: str = Field(default="PLN", max_length=3)


class OrderItem(BaseModel):
    id: UUID
    order_id: UUID
    product_id: str
    name_snapshot: str = Field(..., max_length=255)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class OrderItemCreate(BaseModel):
    order_id: UUID
    product_id: str
    name_snapshot: str = Field(..., max_length=255)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)


class Payment(BaseModel):
    id: UUID
    order_id: UUID
    provider: PaymentProvider
    status: PaymentStatus = PaymentStatus.PENDING
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    external_reference: str | None = Field(None, max_length=255)
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    order_id: UUID
    provider: PaymentProvider
    status: PaymentStatus = PaymentStatus.PENDING
    amount: Decimal = Field(..., ge=0, decimal_places=2)
    external_reference: str | None = Field(None, max_length=255)


class AuditLog(BaseModel):
    id: UUID
    tenant_id: UUID
    actor_user_id: UUID | None = None
    action: str = Field(..., max_length=100)
    entity_type: str = Field(..., max_length=100)
    entity_id: UUID | None = None
    metadata: dict | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuditLogCreate(BaseModel):
    tenant_id: UUID
    actor_user_id: UUID | None = None
    action: str = Field(..., max_length=100)
    entity_type: str = Field(..., max_length=100)
    entity_id: UUID | None = None
    metadata: dict | None = None
