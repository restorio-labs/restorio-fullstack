from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase

from core.exceptions import BadRequestError, NotFoundResponse

_ORDERS_COLLECTION = "kitchen_orders"

_VALID_TRANSITIONS: dict[str, set[str]] = {
    "new": {"preparing", "rejected"},
    "preparing": {"ready"},
    "ready": set(),
    "rejected": {"refunded"},
    "refunded": set(),
}


class OrderService:
    async def list_orders(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        status: str | None = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"restaurantId": restaurant_id}
        if status:
            query["status"] = status

        cursor = db[_ORDERS_COLLECTION].find(query).sort("createdAt", -1)
        orders = await cursor.to_list(length=500)
        return [_serialize_order(o) for o in orders]

    async def get_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
    ) -> dict[str, Any]:
        doc = await db[_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)
        return _serialize_order(doc)

    async def create_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        order_id = data.get("id") or f"K-{uuid4().hex[:6].upper()}"

        doc: dict[str, Any] = {
            "_id": order_id,
            "restaurantId": restaurant_id,
            "tableId": data.get("tableId"),
            "sessionId": data.get("sessionId", ""),
            "items": data.get("items", []),
            "status": "new",
            "paymentStatus": data.get("paymentStatus", "completed"),
            "subtotal": data.get("subtotal", 0),
            "tax": data.get("tax", 0),
            "total": data.get("total", 0),
            "table": data.get("table", ""),
            "time": data.get("time", now.strftime("%H:%M")),
            "notes": data.get("notes"),
            "rejectionReason": None,
            "createdAt": now,
            "updatedAt": now,
        }

        await db[_ORDERS_COLLECTION].insert_one(doc)
        return _serialize_order(doc)

    async def update_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        data: dict[str, Any],
    ) -> dict[str, Any]:
        doc = await db[_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        update: dict[str, Any] = {"updatedAt": datetime.now(UTC)}

        if "items" in data:
            update["items"] = data["items"]
        if "notes" in data:
            update["notes"] = data["notes"]
        if "total" in data:
            update["total"] = data["total"]
        if "subtotal" in data:
            update["subtotal"] = data["subtotal"]
        if "table" in data:
            update["table"] = data["table"]

        await db[_ORDERS_COLLECTION].update_one(
            {"_id": order_id},
            {"$set": update},
        )

        updated = await db[_ORDERS_COLLECTION].find_one({"_id": order_id})
        return _serialize_order(updated)

    async def update_status(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
        new_status: str,
        rejection_reason: str | None = None,
    ) -> dict[str, Any]:
        doc = await db[_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        current = doc["status"]
        allowed = _VALID_TRANSITIONS.get(current, set())
        if new_status not in allowed:
            msg = f"Cannot transition from '{current}' to '{new_status}'"
            raise BadRequestError(msg)

        if new_status == "rejected" and not rejection_reason:
            msg = "Rejection reason is required"
            raise BadRequestError(msg)

        update: dict[str, Any] = {
            "status": new_status,
            "updatedAt": datetime.now(UTC),
        }
        if rejection_reason:
            update["rejectionReason"] = rejection_reason

        await db[_ORDERS_COLLECTION].update_one(
            {"_id": order_id},
            {"$set": update},
        )

        updated = await db[_ORDERS_COLLECTION].find_one({"_id": order_id})
        return _serialize_order(updated)

    async def delete_order(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
    ) -> dict[str, Any]:
        doc = await db[_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        await db[_ORDERS_COLLECTION].delete_one({"_id": order_id})
        return _serialize_order(doc)

    async def get_order_for_archive(
        self,
        db: AsyncIOMotorDatabase,
        restaurant_id: str,
        order_id: str,
    ) -> dict[str, Any]:
        doc = await db[_ORDERS_COLLECTION].find_one(
            {"_id": order_id, "restaurantId": restaurant_id}
        )
        if not doc:
            msg = "Order"
            raise NotFoundResponse(msg, order_id)

        if doc["status"] not in ("ready", "refunded"):
            msg = "Only orders with status 'ready' or 'refunded' can be archived"
            raise BadRequestError(msg)
        return doc


def _serialize_order(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc["_id"],
        "restaurantId": doc.get("restaurantId", ""),
        "tableId": doc.get("tableId"),
        "sessionId": doc.get("sessionId", ""),
        "items": doc.get("items", []),
        "status": doc.get("status", "new"),
        "paymentStatus": doc.get("paymentStatus", "pending"),
        "subtotal": doc.get("subtotal", 0),
        "tax": doc.get("tax", 0),
        "total": doc.get("total", 0),
        "table": doc.get("table", ""),
        "time": doc.get("time", ""),
        "notes": doc.get("notes"),
        "rejectionReason": doc.get("rejectionReason"),
        "createdAt": _to_iso(doc.get("createdAt")),
        "updatedAt": _to_iso(doc.get("updatedAt")),
    }


def _to_iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    if value is None:
        return datetime.now(UTC).isoformat()
    return str(value)
