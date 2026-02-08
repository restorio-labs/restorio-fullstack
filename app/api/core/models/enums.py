from __future__ import annotations

from enum import Enum


class TenantStatus(str, Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class OrderStatus(str, Enum):
    PLACED = "placed"
    PAID = "paid"
    CANCELLED = "cancelled"


class PaymentProvider(str, Enum):
    PRZELEWY24 = "przelewy24"
    CASH = "cash"
    TERMINAL = "terminal"
    OTHER = "other"


class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class AccountType(str, Enum):
    OWNER = "owner"
    WAITER = "waiter"
    KITCHEN = "kitchen"
    MANAGER = "manager"
