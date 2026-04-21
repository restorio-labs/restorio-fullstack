from datetime import UTC, datetime
from unittest.mock import AsyncMock, Mock
from uuid import UUID

import pytest

from services.archive_service import ArchiveService


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
    )

    session.add.assert_called_once()
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
    }
    archived = await service.archive_order(
        db=db,
        session=session,
        tenant_id="t1",
        restaurant_id="t1",
        order_doc=order_doc,
    )
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
    order_doc = {"_id": "K-B", "createdAt": 12345}
    archived = await service.archive_order(
        db=db,
        session=session,
        tenant_id="t1",
        restaurant_id="t1",
        order_doc=order_doc,
    )
    assert isinstance(archived.order_created_at, datetime)
    assert archived.original_order_id == "K-B"
