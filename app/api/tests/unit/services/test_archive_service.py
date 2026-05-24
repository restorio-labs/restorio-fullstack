from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import UUID, uuid4

import pytest

from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from services.archive_service import ArchiveService


def _tenant_row() -> Tenant:
    return Tenant(
        id=UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        public_id="tenant-public-id",
        name="Resto",
        slug="resto",
        status=TenantStatus.ACTIVE,
        p24_merchantid=111,
        p24_api="k" * 32,
        p24_crc="crc",
    )


class _FakeMongoDatabase:
    def __init__(self, delete_one: AsyncMock) -> None:
        self._delete_one = delete_one

    def __getitem__(self, name: str) -> "_FakeMongoCollection":
        assert name == "kitchen_orders"
        return _FakeMongoCollection(self._delete_one)


class _FakeMongoCollection:
    def __init__(self, delete_one: AsyncMock) -> None:
        self.delete_one = delete_one


@pytest.mark.asyncio
async def test_archive_order_persists_in_postgres_before_deleting_mongo() -> None:
    service = ArchiveService()
    session = Mock()
    session.add = Mock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock(
        side_effect=lambda archived: setattr(
            archived, "id", UUID("11111111-1111-1111-1111-111111111111")
        )
    )
    delete_one = AsyncMock()
    db = _FakeMongoDatabase(delete_one)
    order_doc = {
        "_id": "K-ABC123",
        "restaurantId": "tenant-public-id",
        "tableId": "table-1",
        "table": "Table 1",
        "status": "paid",
        "paymentStatus": "completed",
        "subtotal": 12.5,
        "tax": 2.5,
        "total": 15.0,
        "notes": "No onions",
        "items": [{"id": "item-1", "name": "Burger", "quantity": 1, "basePrice": 15.0}],
        "createdAt": datetime(2026, 4, 8, 10, 0, tzinfo=UTC),
    }

    archived = await service.archive_order(
        db=db,
        session=session,
        tenant_id="tenant-public-id",
        restaurant_id="tenant-public-id",
        order_doc=order_doc,
        pg_tenant=_tenant_row(),
    )

    assert session.add.call_count == 2
    session.commit.assert_awaited_once()
    session.refresh.assert_awaited_once()
    delete_one.assert_awaited_once_with({"_id": "K-ABC123"})
    assert archived.original_order_id == "K-ABC123"
    assert str(archived.id) == "11111111-1111-1111-1111-111111111111"


@pytest.mark.asyncio
async def test_archive_order_parses_created_at_string() -> None:
    service = ArchiveService()
    session = Mock()
    session.add = Mock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock(
        side_effect=lambda archived: setattr(
            archived, "id", UUID("22222222-2222-2222-2222-222222222222")
        )
    )
    delete_one = AsyncMock()
    db = _FakeMongoDatabase(delete_one)
    order_doc = {
        "_id": "K-Z",
        "createdAt": "2025-01-15T12:30:00+00:00",
        "total": 9.99,
    }
    archived = await service.archive_order(
        db=db,
        session=session,
        tenant_id="t1",
        restaurant_id="t1",
        order_doc=order_doc,
        pg_tenant=_tenant_row(),
    )
    assert session.add.call_count == 2
    assert archived.order_created_at.isoformat().startswith("2025-01-15T12:30:00+00:00")
    assert archived.original_order_id == "K-Z"


@pytest.mark.asyncio
async def test_archive_order_default_created_at_when_invalid() -> None:
    service = ArchiveService()
    session = Mock()
    session.add = Mock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock(
        side_effect=lambda archived: setattr(
            archived, "id", UUID("33333333-3333-3333-3333-333333333333")
        )
    )
    delete_one = AsyncMock()
    db = _FakeMongoDatabase(delete_one)
    order_doc = {"_id": "K-B", "createdAt": 12345, "total": 5.0}
    archived = await service.archive_order(
        db=db,
        session=session,
        tenant_id="t1",
        restaurant_id="t1",
        order_doc=order_doc,
        pg_tenant=_tenant_row(),
    )
    assert session.add.call_count == 2
    assert isinstance(archived.order_created_at, datetime)
    assert archived.original_order_id == "K-B"


@pytest.mark.asyncio
async def test_archive_order_skips_waiter_ledger_for_mobile_kitchen_order() -> None:
    service = ArchiveService()
    session = Mock()
    session.add = Mock()
    session.commit = AsyncMock()
    session.refresh = AsyncMock(
        side_effect=lambda archived: setattr(
            archived, "id", UUID("44444444-4444-4444-4444-444444444444")
        )
    )
    delete_one = AsyncMock()
    db = _FakeMongoDatabase(delete_one)
    order_doc = {
        "_id": "M-ABC",
        "source": "mobile",
        "total": 200.0,
        "createdAt": datetime(2026, 5, 1, tzinfo=UTC),
    }
    await service.archive_order(
        db=db,
        session=session,
        tenant_id="t1",
        restaurant_id="t1",
        order_doc=order_doc,
        pg_tenant=_tenant_row(),
    )
    assert session.add.call_count == 1
