from datetime import UTC, datetime
from decimal import Decimal
from uuid import uuid4

from core import postgres_models as pm


class TestPostgresModels:
    def test_tenant_model(self) -> None:
        tenant_id = uuid4()
        now = datetime.now(UTC)
        tenant = pm.Tenant(
            id=tenant_id,
            name="Tenant",
            slug="tenant",
            status=pm.TenantStatus.ACTIVE,
            created_at=now,
        )

        assert tenant.id == tenant_id
        assert tenant.status == pm.TenantStatus.ACTIVE

    def test_order_model(self) -> None:
        order_id = uuid4()
        tenant_id = uuid4()
        table_id = uuid4()
        now = datetime.now(UTC)
        order = pm.Order(
            id=order_id,
            tenant_id=tenant_id,
            table_id=table_id,
            status=pm.OrderStatus.PLACED,
            total_amount=Decimal("10.50"),
            currency="PLN",
            created_at=now,
            updated_at=now,
        )

        assert order.id == order_id
        assert order.total_amount == Decimal("10.50")

    def test_payment_model(self) -> None:
        payment_id = uuid4()
        order_id = uuid4()
        now = datetime.now(UTC)
        payment = pm.Payment(
            id=payment_id,
            order_id=order_id,
            provider=pm.PaymentProvider.PRZELEWY24,
            status=pm.PaymentStatus.PENDING,
            amount=Decimal("5.00"),
            external_reference=None,
            created_at=now,
            updated_at=now,
        )

        assert payment.id == payment_id
        assert payment.provider == pm.PaymentProvider.PRZELEWY24
