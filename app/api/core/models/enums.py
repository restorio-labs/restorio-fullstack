from __future__ import annotations

from enum import StrEnum


class TenantStatus(StrEnum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class GeocodingStatus(StrEnum):
    NOT_GEOCODED = "not_geocoded"
    PENDING = "pending"
    GEOCODED = "geocoded"
    FAILED = "failed"


class LocationSource(StrEnum):
    GEOCODER = "geocoder"
    MANUAL = "manual"
    IMPORTED = "imported"


class LocationPrecision(StrEnum):
    ROOFTOP = "rooftop"
    INTERPOLATED = "interpolated"
    STREET = "street"
    POSTAL_CODE = "postal_code"
    CITY = "city"
    APPROXIMATE = "approximate"


class OrderStatus(StrEnum):
    PLACED = "placed"
    PAID = "paid"
    CANCELLED = "cancelled"
    NEW = "new"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY = "ready"
    REJECTED = "rejected"
    REFUNDED = "refunded"


class PaymentProvider(StrEnum):
    PRZELEWY24 = "przelewy24"
    CASH = "cash"
    TERMINAL = "terminal"
    OTHER = "other"


class PaymentStatus(StrEnum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class TableSessionOrigin(StrEnum):
    MOBILE = "mobile"
    WAITER = "waiter"


class TableSessionStatus(StrEnum):
    ACTIVE = "active"
    RELEASED = "released"
    EXPIRED = "expired"
    COMPLETED = "completed"


class AccountType(StrEnum):
    OWNER = "owner"
    WAITER = "waiter"
    KITCHEN = "kitchen"
    MANAGER = "manager"
