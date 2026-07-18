from datetime import UTC, datetime
from uuid import uuid4

from core.models.transaction import Transaction
from services.mobile_payment_sync import (
    build_mobile_kitchen_order_document,
    mobile_order_dict_from_transaction,
)

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
