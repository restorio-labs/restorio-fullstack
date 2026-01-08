from core.models.enums import (
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
    TenantStatus,
)


class TestTenantStatus:
    def test_tenant_status_values(self) -> None:
        assert TenantStatus.ACTIVE.value == "ACTIVE"
        assert TenantStatus.SUSPENDED.value == "SUSPENDED"
        assert TenantStatus.INACTIVE.value == "INACTIVE"

    def test_tenant_status_enum_membership(self) -> None:
        assert TenantStatus.ACTIVE in TenantStatus
        assert TenantStatus.SUSPENDED in TenantStatus
        assert TenantStatus.INACTIVE in TenantStatus


class TestOrderStatus:
    def test_order_status_values(self) -> None:
        assert OrderStatus.PLACED.value == "PLACED"
        assert OrderStatus.PAID.value == "PAID"
        assert OrderStatus.CANCELLED.value == "CANCELLED"

    def test_order_status_enum_membership(self) -> None:
        assert OrderStatus.PLACED in OrderStatus
        assert OrderStatus.PAID in OrderStatus
        assert OrderStatus.CANCELLED in OrderStatus


class TestPaymentProvider:
    def test_payment_provider_values(self) -> None:
        assert PaymentProvider.PRZELEWY24.value == "PRZELEWY24"
        assert PaymentProvider.CASH.value == "CASH"
        assert PaymentProvider.TERMINAL.value == "TERMINAL"
        assert PaymentProvider.OTHER.value == "OTHER"

    def test_payment_provider_enum_membership(self) -> None:
        assert PaymentProvider.PRZELEWY24 in PaymentProvider
        assert PaymentProvider.CASH in PaymentProvider
        assert PaymentProvider.TERMINAL in PaymentProvider
        assert PaymentProvider.OTHER in PaymentProvider


class TestPaymentStatus:
    def test_payment_status_values(self) -> None:
        assert PaymentStatus.PENDING.value == "PENDING"
        assert PaymentStatus.COMPLETED.value == "COMPLETED"
        assert PaymentStatus.FAILED.value == "FAILED"
        assert PaymentStatus.REFUNDED.value == "REFUNDED"

    def test_payment_status_enum_membership(self) -> None:
        assert PaymentStatus.PENDING in PaymentStatus
        assert PaymentStatus.COMPLETED in PaymentStatus
        assert PaymentStatus.FAILED in PaymentStatus
        assert PaymentStatus.REFUNDED in PaymentStatus
