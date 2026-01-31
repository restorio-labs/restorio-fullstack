from __future__ import annotations

from enum import Enum as PyEnum


class TenantStatus(PyEnum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class OrderStatus(PyEnum):
    PLACED = "PLACED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class PaymentProvider(PyEnum):
    PRZELEWY24 = "PRZELEWY24"
    CASH = "CASH"
    TERMINAL = "TERMINAL"
    OTHER = "OTHER"


class PaymentStatus(PyEnum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class AccountType(str, PyEnum):
    OWNER = "owner"
    WAITER = "waiter"
    KITCHEN = "kitchen"
