from enum import Enum


class TenantStatus(str, Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    SUSPENDED = "SUSPENDED"
    INACTIVE = "INACTIVE"


class OrderStatus(str, Enum):
    PLACED = "PLACED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"


class PaymentProvider(str, Enum):
    PRZELEWY24 = "PRZELEWY24"
    TERMINAL = "TERMINAL"
    CASH = "CASH"
    OTHER = "OTHER"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
