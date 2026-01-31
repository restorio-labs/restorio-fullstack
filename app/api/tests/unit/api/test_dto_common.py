from pydantic import ValidationError
import pytest

from api.v1.dto.common import OrderStatus, PaymentProvider, PaymentStatus, TenantStatus


class TestEnums:
    def test_tenant_status_values(self) -> None:
        assert TenantStatus.ACTIVE.value == "ACTIVE"
        assert TenantStatus.SUSPENDED.value == "SUSPENDED"
        assert TenantStatus.INACTIVE.value == "INACTIVE"

    def test_order_status_values(self) -> None:
        assert OrderStatus.PLACED.value == "PLACED"
        assert OrderStatus.PAID.value == "PAID"
        assert OrderStatus.CANCELLED.value == "CANCELLED"

    def test_payment_provider_values(self) -> None:
        assert PaymentProvider.PRZELEWY24.value == "PRZELEWY24"
        assert PaymentProvider.TERMINAL.value == "TERMINAL"
        assert PaymentProvider.CASH.value == "CASH"
        assert PaymentProvider.OTHER.value == "OTHER"

    def test_payment_status_values(self) -> None:
        assert PaymentStatus.PENDING.value == "PENDING"
        assert PaymentStatus.COMPLETED.value == "COMPLETED"
        assert PaymentStatus.FAILED.value == "FAILED"
        assert PaymentStatus.REFUNDED.value == "REFUNDED"


class TestCurrencyCode:
    def test_valid_currency_codes(self) -> None:
        from api.v1.dto.common import BaseDTO, CurrencyCode

        class TestModel(BaseDTO):
            currency: CurrencyCode

        valid = TestModel(currency="USD")
        assert valid.currency == "USD"

        valid2 = TestModel(currency="PLN")
        assert valid2.currency == "PLN"

    def test_invalid_currency_code_too_short(self) -> None:
        from api.v1.dto.common import BaseDTO, CurrencyCode

        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError) as exc_info:
            TestModel(currency="US")

        errors = exc_info.value.errors()
        assert any("at least 3 characters" in str(err) for err in errors)

    def test_invalid_currency_code_too_long(self) -> None:
        from api.v1.dto.common import BaseDTO, CurrencyCode

        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError) as exc_info:
            TestModel(currency="USDD")

        errors = exc_info.value.errors()
        assert any("at most 3 characters" in str(err) for err in errors)

    def test_invalid_currency_code_lowercase(self) -> None:
        from api.v1.dto.common import BaseDTO, CurrencyCode

        class TestModel(BaseDTO):
            currency: CurrencyCode

        with pytest.raises(ValidationError):
            TestModel(currency="usd")
