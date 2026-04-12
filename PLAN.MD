# Finalized Orders Audit and Solution

## Findings

### 1. The payment flow archived to a different SQL model than the waiter history was reading
- The waiter payment flow in `app/apps/waiter-panel/src/views/FloorRuntimeView.tsx` marked Mongo orders as `paid` and then called the archive endpoint.
- The backend archive route in `app/api/routes/v1/orders.py` stored the final row in Postgres `archived_orders`.
- The waiter history sidebar in `app/apps/waiter-panel/src/components/OrdersSidebar.tsx` was reading tenant SQL orders from `/tenants/:id/orders`, which comes from the separate `orders` table.
- Result: a completed order could be removed from Mongo and still never appear in the waiter history because the UI was looking at the wrong SQL source.

### 2. The waiter UI cleared table state even when archive persistence failed
- `handleConfirmPayment` cleared the selected table state after the `try/catch`, not only after a successful archive.
- Result: staff could see the table as free even when the archive step failed.

### 3. The SQL order model was carrying mutable detail in the wrong place
- `orders` was acting as the parent record, while `order_items` stored item lines and `orders.notes` stored descriptive payload.
- That shape made the finalized-order snapshot harder to persist and harder to align with the archive flow.

## Solution Implemented

### Finalized orders
- Added `GET /restaurants/{restaurant_id}/orders/archived` in `app/api/routes/v1/orders.py`.
- Added `ArchivedOrderResponseDTO` in `app/api/core/dto/v1/orders/responses.py`.
- Added `ordersApi.listArchived()` in `app/packages/api-client/src/resources/orders.ts`.
- Switched the waiter sidebar to read archived orders instead of tenant SQL orders.

### Payment closeout safety
- Updated `handleConfirmPayment` so the waiter panel clears the table only after both `updateStatus(..., "paid")` and `archive(...)` succeed.
- Added invalidation for the new archived-orders query so the history updates immediately after payment.

### SQL order reshape
- Added `OrderDetails` as a 1:1 table in `app/api/core/models/order_details.py`.
- Removed `OrderItem` usage from tenant order persistence and moved item storage to `order_details.items_snapshot`.
- Moved notes into `order_details.notes`.
- Kept `orders` as the relational anchor row for status, waiter, totals, timestamps, and payment linkage.

### Migration
- Added Alembic migration `app/api/alembic/versions/20260408_120000_add_order_details_and_drop_order_items.py`.
- Migration creates `order_details`, backfills from `orders.notes` and `order_items`, then drops `order_items` and `orders.notes`.

## Key Files Changed
- `app/api/routes/v1/orders.py`
- `app/api/routes/v1/tenants/orders.py`
- `app/api/services/archive_service.py`
- `app/api/core/models/order.py`
- `app/api/core/models/order_details.py`
- `app/api/core/dto/v1/orders/requests.py`
- `app/api/core/dto/v1/orders/responses.py`
- `app/apps/waiter-panel/src/views/FloorRuntimeView.tsx`
- `app/apps/waiter-panel/src/components/OrdersSidebar.tsx`
- `app/packages/api-client/src/resources/orders.ts`

## Verification
- `bun test app/packages/api-client/tests/unit/resources/orders.test.ts`
- `UV_CACHE_DIR=/tmp/uv-cache TMPDIR=/tmp uv run pytest tests/unit/routes/v1/test_dto_orders.py`
- `UV_CACHE_DIR=/tmp/uv-cache TMPDIR=/tmp uv run pytest tests/unit/services/test_order_service.py`
- `UV_CACHE_DIR=/tmp/uv-cache TMPDIR=/tmp uv run pytest tests/unit/services/test_archive_service.py`
- Python syntax checks were also run against the edited API modules with `py_compile`.

## Notes
- The worktree already contained unrelated edits before this implementation. Changes were applied only on top of the current order/archive/waiter flow without reverting unrelated work.
