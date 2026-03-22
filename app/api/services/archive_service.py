from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from core.models.archived_order import ArchivedOrder


class ArchiveService:
    async def archive_order(
        self,
        db: AsyncIOMotorDatabase,
        session: AsyncSession,
        tenant_id: str,
        restaurant_id: str,
        order_doc: dict[str, Any],
    ) -> ArchivedOrder:
        created_at = order_doc.get("createdAt")
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at)
        elif not isinstance(created_at, datetime):
            created_at = datetime.now(UTC)

        archived = ArchivedOrder(
            original_order_id=str(order_doc["_id"]),
            tenant_id=tenant_id,
            restaurant_id=restaurant_id,
            table_id=order_doc.get("tableId"),
            table_label=order_doc.get("table", ""),
            status=order_doc.get("status", "ready"),
            payment_status=order_doc.get("paymentStatus", "completed"),
            rejection_reason=order_doc.get("rejectionReason"),
            subtotal=Decimal(str(order_doc.get("subtotal", 0))),
            tax=Decimal(str(order_doc.get("tax", 0))),
            total=Decimal(str(order_doc.get("total", 0))),
            currency="PLN",
            notes=order_doc.get("notes"),
            items_snapshot=order_doc.get("items", []),
            order_created_at=created_at,
            archived_at=datetime.now(UTC),
        )

        session.add(archived)
        await session.commit()
        await session.refresh(archived)

        await db["kitchen_orders"].delete_one({"_id": order_doc["_id"]})

        return archived
