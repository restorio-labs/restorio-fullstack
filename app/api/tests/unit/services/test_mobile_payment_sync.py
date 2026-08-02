from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

from pymongo.errors import DuplicateKeyError
import pytest

from core.constants import KITCHEN_ORDERS_COLLECTION, ORDERS_COLLECTION
from core.models.tenant import Tenant
from core.models.transaction import Transaction
from services.mobile_payment_sync import (
    apply_mobile_payment_mongo_and_session_effects,
    build_mobile_kitchen_order_document,
    mobile_order_dict_from_transaction,
)
from services.payment_service import TX_STATUS_PAID, TX_STATUS_REFUNDED

EXPECTED_TOTAL_AMOUNT_MINOR = 4200
EXPECTED_TABLE_NUMBER = 7


def test_mobile_order_dict_from_transaction_builds_payload() -> None:
    sid = uuid4()
    tx = Transaction(
        session_id=sid,
        tenant_id=uuid4(),
        merchant_id=1,
        pos_id=1,
        amount=EXPECTED_TOTAL_AMOUNT_MINOR,
        currency="PLN",
        description="d",
        email="a@b.com",
        country="PL",
        language="pl",
        url_return="u",
        url_status="u2",
        sign="s",
    )
    tx.order = {
        "tableRef": "ref-1",
        "tableNumber": EXPECTED_TABLE_NUMBER,
        "items": [{"name": "Soup", "quantity": 1, "unitPrice": 42.0}],
        "note": "n",
        "invoiceData": {"companyName": "X", "nip": "1234563218"},
    }
    payload = mobile_order_dict_from_transaction(tx)
    assert payload is not None
    assert payload["totalAmount"] == EXPECTED_TOTAL_AMOUNT_MINOR
    assert payload["tableNumber"] == EXPECTED_TABLE_NUMBER
    assert payload["items"][0]["name"] == "Soup"


def test_build_mobile_kitchen_order_includes_invoice_data() -> None:
    now = datetime.now(UTC)
    mobile_order = {
        "_id": "oid",
        "tableRef": "t1",
        "items": [{"name": "Coffee", "quantity": 2, "unitPrice": 12.5}],
        "totalAmount": 2500,
        "tableNumber": 5,
        "note": "extra hot",
        "invoiceData": {
            "companyName": "Acme",
            "nip": "1234563218",
            "street": "ul. Test 1",
            "city": "Warsaw",
            "postalCode": "00-001",
            "country": "PL",
        },
    }
    doc = build_mobile_kitchen_order_document(
        mobile_order,
        restaurant_public_id="rest-1",
        session_id_str="aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        now=now,
    )
    assert doc["_id"] == "M-AAAAAAAABBBBCCCCDDDDEEEEEEEEEEEE"
    assert doc.get("invoiceData") is not None
    assert doc["invoiceData"]["companyName"] == "Acme"
    assert doc["invoiceData"]["nip"] == "1234563218"


def test_build_mobile_kitchen_order_omits_empty_invoice_payload() -> None:
    now = datetime.now(UTC)
    mobile_order = {
        "_id": "oid",
        "tableRef": "t1",
        "items": [],
        "totalAmount": 100,
        "tableNumber": 1,
        "note": None,
        "invoiceData": {},
    }
    doc = build_mobile_kitchen_order_document(
        mobile_order,
        restaurant_public_id="rest-1",
        session_id_str="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        now=now,
    )
    assert doc["_id"] == "M-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB"
    assert "invoiceData" not in doc


def test_mobile_order_dict_rejects_non_mapping_order() -> None:
    transaction = MagicMock(spec=Transaction)
    transaction.order = None

    assert mobile_order_dict_from_transaction(transaction) is None


@pytest.mark.parametrize("transaction_note", ["transaction note", None])
def test_mobile_order_dict_normalizes_items_and_falls_back_to_transaction_note(
    transaction_note: str | None,
) -> None:
    transaction = MagicMock(spec=Transaction)
    transaction.session_id = uuid4()
    transaction.amount = 500
    transaction.note = transaction_note
    transaction.order = {"items": "invalid", "note": 123, "invoiceData": "invalid"}

    result = mobile_order_dict_from_transaction(transaction)

    assert result is not None
    assert result["items"] == []
    assert result["note"] == transaction_note
    assert result["invoiceData"] is None


def _database_with_collections(
    *, mobile_order: dict | None, insert_side_effect: Exception | None = None
) -> tuple[MagicMock, MagicMock, MagicMock]:
    orders = MagicMock()
    orders.find_one = AsyncMock(return_value=mobile_order)
    orders.update_one = AsyncMock()
    kitchen_orders = MagicMock()
    kitchen_orders.insert_one = AsyncMock(side_effect=insert_side_effect)
    db = MagicMock()
    db.__getitem__.side_effect = {
        ORDERS_COLLECTION: orders,
        KITCHEN_ORDERS_COLLECTION: kitchen_orders,
    }.__getitem__
    return db, orders, kitchen_orders


@pytest.mark.asyncio
async def test_apply_mobile_payment_effects_suppresses_duplicate_kitchen_order() -> None:
    transaction = MagicMock(spec=Transaction)
    transaction.status = TX_STATUS_PAID
    transaction.session_id = uuid4()
    transaction.amount = 1500
    transaction.note = None
    transaction.order = {
        "tableNumber": 2,
        "items": [{"name": "Soup", "quantity": 1, "unitPrice": 15}],
    }
    tenant = MagicMock(spec=Tenant)
    tenant.public_id = "restaurant-1"
    db, orders, kitchen_orders = _database_with_collections(
        mobile_order=None,
        insert_side_effect=DuplicateKeyError("already inserted"),
    )
    table_session_service = MagicMock()
    table_session_service.mark_completed_by_session_id = AsyncMock()
    pg_session = MagicMock()

    await apply_mobile_payment_mongo_and_session_effects(
        db,
        pg_session,
        table_session_service,
        tenant=tenant,
        transaction=transaction,
        session_id_str=str(transaction.session_id),
    )

    orders.update_one.assert_awaited_once()
    kitchen_orders.insert_one.assert_awaited_once()
    table_session_service.mark_completed_by_session_id.assert_awaited_once()


@pytest.mark.asyncio
async def test_apply_mobile_payment_effects_completes_refunded_session() -> None:
    transaction = MagicMock(spec=Transaction)
    transaction.status = TX_STATUS_REFUNDED
    tenant = MagicMock(spec=Tenant)
    db, _, kitchen_orders = _database_with_collections(mobile_order=None)
    table_session_service = MagicMock()
    table_session_service.mark_completed_by_session_id = AsyncMock()
    pg_session = MagicMock()

    await apply_mobile_payment_mongo_and_session_effects(
        db,
        pg_session,
        table_session_service,
        tenant=tenant,
        transaction=transaction,
        session_id_str="session-1",
    )

    kitchen_orders.insert_one.assert_not_awaited()
    table_session_service.mark_completed_by_session_id.assert_awaited_once_with(
        pg_session,
        session_id="session-1",
    )
