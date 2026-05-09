# Order Lifecycle (Hybrid Approach)

This document describes the order data flow using a hybrid storage approach:

- **MongoDB** for active kitchen workflow (real-time operations)
- **PostgreSQL** for completed/archived orders (reporting, history)

## Storage Systems

### MongoDB Collections

| Collection | Purpose | Used By |
| --- | --- | --- |
| `orders` | Mobile app orders (pre-payment) | `routes/v1/public/public.py` |
| `kitchen_orders` | Active kitchen workflow | `services/order_service.py`, kitchen panel |
| `menus` | Restaurant menus | `services/mongo_menu_service.py` |
| `restaurant_kitchen_config` | Kitchen rejection labels | `services/kitchen_config_service.py` |
| `canvas_versions` | Floor canvas version history | `services/canvas_versioning.py` |

### PostgreSQL Tables

| Table | Purpose | Used By |
| --- | --- | --- |
| `orders` | Waiter-created orders | `routes/v1/tenants/orders.py` |
| `archived_orders` | Completed orders from MongoDB | `services/archive_service.py` |
| `transactions` | Przelewy24 payment records | `services/payment_service.py` |

## Order Flow

### Mobile Order Flow

```text
1. Customer places order via mobile app
   └─> MongoDB `orders` collection (status: new, paymentStatus: pending)

2. Payment initiated via Przelewy24
   └─> PostgreSQL `transactions` table created

3. Payment webhook received (p24_status.py)
   ├─> MongoDB `orders` updated (paymentStatus: completed)
   └─> MongoDB `kitchen_orders` created (status: new)

4. Kitchen processes order
   └─> MongoDB `kitchen_orders` status transitions:
       new → preparing → ready_to_serve → delivered → paid

5. Order completed/archived
   └─> PostgreSQL `archived_orders` (via ArchiveService)
   └─> MongoDB `kitchen_orders` document deleted
```

### Waiter Order Flow

```text
1. Waiter creates order via admin panel
   └─> PostgreSQL `orders` table (status: placed)

2. Order sent to kitchen
   └─> MongoDB `kitchen_orders` created

3. Kitchen processes order
   └─> MongoDB `kitchen_orders` status transitions

4. Order completed
   └─> PostgreSQL `archived_orders` (via ArchiveService)
```

## Status Values

### MongoDB `kitchen_orders.status`

| Status | Description |
| --- | --- |
| `new` | Just received, awaiting kitchen acknowledgment |
| `preparing` | Kitchen is preparing the order |
| `ready_to_serve` | Ready for pickup/delivery |
| `delivered` | Served to customer |
| `paid` | Payment completed |
| `rejected` | Kitchen rejected the order |
| `refunded` | Payment refunded |

### MongoDB `orders.paymentStatus`

| Status | Description |
| --- | --- |
| `pending` | Awaiting payment |
| `completed` | Payment successful |
| `refunded` | Payment refunded |

## Key Services

- **`OrderService`** (`services/order_service.py`): CRUD for `kitchen_orders`
- **`ArchiveService`** (`services/archive_service.py`): Move completed orders to PostgreSQL
- **`P24Service`** (`services/payment_service.py`): Przelewy24 integration
- **`TableSessionService`** (`services/table_session_service.py`): Mobile session management

## Collection Constants

All MongoDB collection names are centralized in `core/constants/collections.py`:

```python
from core.constants import (
    ORDERS_COLLECTION,           # "orders"
    KITCHEN_ORDERS_COLLECTION,   # "kitchen_orders"
    MENUS_COLLECTION,            # "menus"
    KITCHEN_CONFIG_COLLECTION,   # "restaurant_kitchen_config"
    CANVAS_VERSIONS_COLLECTION,  # "canvas_versions"
)
```
