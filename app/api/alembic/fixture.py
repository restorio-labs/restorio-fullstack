"""
Dev seed script — realistic fixture data for local/staging environments.

Usage:
    python seed_dev.py

Requires DATABASE_URL in environment (or .env file via python-dotenv).
Passwords are bcrypt-hashed. All plaintext passwords are "password123".

Safe to re-run: wraps everything in a transaction and rolls back on error.
"""

from datetime import UTC, datetime, timedelta
import json
import os
import uuid

import sqlalchemy as sa  # noqa: F401
from sqlalchemy import create_engine, text

# ---------------------------------------------------------------------------
# Connection
# ---------------------------------------------------------------------------

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    msg = "DATABASE_URL environment variable is not set."
    raise RuntimeError(msg)

engine = create_engine(DATABASE_URL)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def uid() -> str:
    return str(uuid.uuid4())


def now(offset_days: int = 0, offset_hours: int = 0) -> datetime:
    base = datetime.now(UTC)
    return base + timedelta(days=offset_days, hours=offset_hours)


# bcrypt hash of "password123" — pre-computed so we don't need bcrypt at seed time
PASSWORD_HASH = "$2b$12$KIXuO3Hmq2lHzC4tRS5A5.qhJpJpRKQUaGEeMdm0bA7Wf8MMYZ3NK"

# ---------------------------------------------------------------------------
# IDs — defined upfront so foreign keys can reference them freely
# ---------------------------------------------------------------------------

# Tenants
TENANT_BISTRO = uid()
TENANT_PIZZA = uid()
TENANT_CAFE = uid()

# Users — Bistro
U_BISTRO_OWNER = uid()
U_BISTRO_MANAGER = uid()
U_BISTRO_WAITER1 = uid()
U_BISTRO_WAITER2 = uid()
U_BISTRO_KITCHEN = uid()

# Users — Pizza Palace
U_PIZZA_OWNER = uid()
U_PIZZA_WAITER = uid()
U_PIZZA_KITCHEN = uid()

# Users — Cafe (suspended tenant, minimal data)
U_CAFE_OWNER = uid()

# Venues
V_BISTRO_MAIN = uid()
V_BISTRO_TERRACE = uid()
V_PIZZA_MAIN = uid()

# Floor canvases
FC_BISTRO_MAIN_V1 = uid()
FC_BISTRO_MAIN_V2 = uid()
FC_BISTRO_TERRACE_V1 = uid()
FC_PIZZA_MAIN_V1 = uid()

# Tables — Bistro main floor
RT_B1 = uid()
RT_B2 = uid()
RT_B3 = uid()
RT_B4 = uid()
RT_B5 = uid()
# Tables — Bistro terrace
RT_BT1 = uid()
RT_BT2 = uid()
# Tables — Pizza Palace
RT_P1 = uid()
RT_P2 = uid()
RT_P3 = uid()

# Orders
O1 = uid()
O2 = uid()
O3 = uid()
O4 = uid()
O5 = uid()
O6 = uid()

# Order items
OI1a = uid()
OI1b = uid()
OI1c = uid()
OI2a = uid()
OI2b = uid()
OI3a = uid()
OI3b = uid()
OI3c = uid()
OI4a = uid()
OI4b = uid()
OI5a = uid()
OI5b = uid()
OI6a = uid()

# Payments
PAY1 = uid()
PAY2 = uid()
PAY3 = uid()
PAY4 = uid()
PAY5 = uid()


# ---------------------------------------------------------------------------
# Data definitions
# ---------------------------------------------------------------------------

TENANTS = [
    {
        "id": TENANT_BISTRO,
        "name": "The Grand Bistro",
        "slug": "grand-bistro",
        "status": "ACTIVE",
        "owner_id": U_BISTRO_OWNER,
        "created_at": now(offset_days=-60),
    },
    {
        "id": TENANT_PIZZA,
        "name": "Pizza Palace",
        "slug": "pizza-palace",
        "status": "ACTIVE",
        "owner_id": U_PIZZA_OWNER,
        "created_at": now(offset_days=-30),
    },
    {
        "id": TENANT_CAFE,
        "name": "Corner Café",
        "slug": "corner-cafe",
        "status": "SUSPENDED",
        "owner_id": U_CAFE_OWNER,
        "created_at": now(offset_days=-10),
    },
]

USERS = [
    # --- Grand Bistro ---
    {
        "id": U_BISTRO_OWNER,
        "email": "owner@grand-bistro.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "owner",
        "is_active": True,
        "tenant_id": TENANT_BISTRO,
        "created_at": now(offset_days=-60),
    },
    {
        "id": U_BISTRO_MANAGER,
        "email": "manager@grand-bistro.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "manager",
        "is_active": True,
        "tenant_id": TENANT_BISTRO,
        "created_at": now(offset_days=-58),
    },
    {
        "id": U_BISTRO_WAITER1,
        "email": "waiter1@grand-bistro.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "waiter",
        "is_active": True,
        "tenant_id": TENANT_BISTRO,
        "created_at": now(offset_days=-55),
    },
    {
        "id": U_BISTRO_WAITER2,
        "email": "waiter2@grand-bistro.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "waiter",
        "is_active": False,  # deactivated — useful edge case
        "tenant_id": TENANT_BISTRO,
        "created_at": now(offset_days=-50),
    },
    {
        "id": U_BISTRO_KITCHEN,
        "email": "kitchen@grand-bistro.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "kitchen",
        "is_active": True,
        "tenant_id": TENANT_BISTRO,
        "created_at": now(offset_days=-55),
    },
    # --- Pizza Palace ---
    {
        "id": U_PIZZA_OWNER,
        "email": "owner@pizza-palace.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "owner",
        "is_active": True,
        "tenant_id": TENANT_PIZZA,
        "created_at": now(offset_days=-30),
    },
    {
        "id": U_PIZZA_WAITER,
        "email": "waiter@pizza-palace.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "waiter",
        "is_active": True,
        "tenant_id": TENANT_PIZZA,
        "created_at": now(offset_days=-28),
    },
    {
        "id": U_PIZZA_KITCHEN,
        "email": "kitchen@pizza-palace.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "kitchen",
        "is_active": True,
        "tenant_id": TENANT_PIZZA,
        "created_at": now(offset_days=-28),
    },
    # --- Corner Café (suspended) ---
    {
        "id": U_CAFE_OWNER,
        "email": "owner@corner-cafe.dev",
        "password_hash": PASSWORD_HASH,
        "account_type": "owner",
        "is_active": True,
        "tenant_id": TENANT_CAFE,
        "created_at": now(offset_days=-10),
    },
]

USER_TENANTS = [
    # Bistro
    {
        "user_id": U_BISTRO_OWNER,
        "tenant_id": TENANT_BISTRO,
        "role": "owner",
        "created_at": now(offset_days=-60),
    },
    {
        "user_id": U_BISTRO_MANAGER,
        "tenant_id": TENANT_BISTRO,
        "role": "manager",
        "created_at": now(offset_days=-58),
    },
    {
        "user_id": U_BISTRO_WAITER1,
        "tenant_id": TENANT_BISTRO,
        "role": "waiter",
        "created_at": now(offset_days=-55),
    },
    {
        "user_id": U_BISTRO_WAITER2,
        "tenant_id": TENANT_BISTRO,
        "role": "waiter",
        "created_at": now(offset_days=-50),
    },
    {
        "user_id": U_BISTRO_KITCHEN,
        "tenant_id": TENANT_BISTRO,
        "role": "kitchen",
        "created_at": now(offset_days=-55),
    },
    # Pizza Palace
    {
        "user_id": U_PIZZA_OWNER,
        "tenant_id": TENANT_PIZZA,
        "role": "owner",
        "created_at": now(offset_days=-30),
    },
    {
        "user_id": U_PIZZA_WAITER,
        "tenant_id": TENANT_PIZZA,
        "role": "waiter",
        "created_at": now(offset_days=-28),
    },
    {
        "user_id": U_PIZZA_KITCHEN,
        "tenant_id": TENANT_PIZZA,
        "role": "kitchen",
        "created_at": now(offset_days=-28),
    },
    # Café
    {
        "user_id": U_CAFE_OWNER,
        "tenant_id": TENANT_CAFE,
        "role": "owner",
        "created_at": now(offset_days=-10),
    },
]

VENUES = [
    {
        "id": V_BISTRO_MAIN,
        "tenant_id": TENANT_BISTRO,
        "name": "Main Floor",
        "active_layout_version_id": FC_BISTRO_MAIN_V2,  # points to latest canvas
        "created_at": now(offset_days=-59),
        "updated_at": now(offset_days=-5),
    },
    {
        "id": V_BISTRO_TERRACE,
        "tenant_id": TENANT_BISTRO,
        "name": "Terrace",
        "active_layout_version_id": FC_BISTRO_TERRACE_V1,
        "created_at": now(offset_days=-59),
        "updated_at": now(offset_days=-59),
    },
    {
        "id": V_PIZZA_MAIN,
        "tenant_id": TENANT_PIZZA,
        "name": "Dining Room",
        "active_layout_version_id": FC_PIZZA_MAIN_V1,
        "created_at": now(offset_days=-29),
        "updated_at": now(offset_days=-29),
    },
]

_bistro_elements_v1 = [
    {"type": "table", "table_id": RT_B1, "x": 50, "y": 50, "w": 80, "h": 80},
    {"type": "table", "table_id": RT_B2, "x": 200, "y": 50, "w": 80, "h": 80},
    {"type": "table", "table_id": RT_B3, "x": 350, "y": 50, "w": 80, "h": 80},
]
_bistro_elements_v2 = [
    *_bistro_elements_v1,
    {"type": "table", "table_id": RT_B4, "x": 50, "y": 200, "w": 80, "h": 80},
    {"type": "table", "table_id": RT_B5, "x": 200, "y": 200, "w": 80, "h": 80},
    {"type": "wall", "x": 0, "y": 150, "w": 800, "h": 10},
]

FLOOR_CANVASES = [
    {
        "id": FC_BISTRO_MAIN_V1,
        "venue_id": V_BISTRO_MAIN,
        "name": "Main Floor — v1",
        "width": 800,
        "height": 600,
        "elements": _bistro_elements_v1,
        "version": 1,
        "created_at": now(offset_days=-59),
        "updated_at": now(offset_days=-59),
    },
    {
        "id": FC_BISTRO_MAIN_V2,
        "venue_id": V_BISTRO_MAIN,
        "name": "Main Floor — v2",
        "width": 800,
        "height": 600,
        "elements": _bistro_elements_v2,
        "version": 2,
        "created_at": now(offset_days=-5),
        "updated_at": now(offset_days=-5),
    },
    {
        "id": FC_BISTRO_TERRACE_V1,
        "venue_id": V_BISTRO_TERRACE,
        "name": "Terrace Layout",
        "width": 600,
        "height": 400,
        "elements": [
            {"type": "table", "table_id": RT_BT1, "x": 50, "y": 50, "w": 80, "h": 80},
            {"type": "table", "table_id": RT_BT2, "x": 200, "y": 50, "w": 80, "h": 80},
        ],
        "version": 1,
        "created_at": now(offset_days=-59),
        "updated_at": now(offset_days=-59),
    },
    {
        "id": FC_PIZZA_MAIN_V1,
        "venue_id": V_PIZZA_MAIN,
        "name": "Dining Room Layout",
        "width": 800,
        "height": 600,
        "elements": [
            {"type": "table", "table_id": RT_P1, "x": 100, "y": 100, "w": 80, "h": 80},
            {"type": "table", "table_id": RT_P2, "x": 250, "y": 100, "w": 80, "h": 80},
            {"type": "table", "table_id": RT_P3, "x": 400, "y": 100, "w": 120, "h": 80},
        ],
        "version": 1,
        "created_at": now(offset_days=-29),
        "updated_at": now(offset_days=-29),
    },
]

RESTAURANT_TABLES = [
    # Grand Bistro — main floor
    {
        "id": RT_B1,
        "tenant_id": TENANT_BISTRO,
        "label": "B1",
        "capacity": 2,
        "is_active": True,
        "created_at": now(offset_days=-59),
    },
    {
        "id": RT_B2,
        "tenant_id": TENANT_BISTRO,
        "label": "B2",
        "capacity": 4,
        "is_active": True,
        "created_at": now(offset_days=-59),
    },
    {
        "id": RT_B3,
        "tenant_id": TENANT_BISTRO,
        "label": "B3",
        "capacity": 4,
        "is_active": True,
        "created_at": now(offset_days=-59),
    },
    {
        "id": RT_B4,
        "tenant_id": TENANT_BISTRO,
        "label": "B4",
        "capacity": 6,
        "is_active": True,
        "created_at": now(offset_days=-5),
    },
    {
        "id": RT_B5,
        "tenant_id": TENANT_BISTRO,
        "label": "B5",
        "capacity": 6,
        "is_active": False,
        "created_at": now(offset_days=-5),
    },  # inactive
    # Grand Bistro — terrace
    {
        "id": RT_BT1,
        "tenant_id": TENANT_BISTRO,
        "label": "T1",
        "capacity": 2,
        "is_active": True,
        "created_at": now(offset_days=-59),
    },
    {
        "id": RT_BT2,
        "tenant_id": TENANT_BISTRO,
        "label": "T2",
        "capacity": 4,
        "is_active": True,
        "created_at": now(offset_days=-59),
    },
    # Pizza Palace
    {
        "id": RT_P1,
        "tenant_id": TENANT_PIZZA,
        "label": "P1",
        "capacity": 2,
        "is_active": True,
        "created_at": now(offset_days=-29),
    },
    {
        "id": RT_P2,
        "tenant_id": TENANT_PIZZA,
        "label": "P2",
        "capacity": 4,
        "is_active": True,
        "created_at": now(offset_days=-29),
    },
    {
        "id": RT_P3,
        "tenant_id": TENANT_PIZZA,
        "label": "P3",
        "capacity": 8,
        "is_active": True,
        "created_at": now(offset_days=-29),
    },
]

ORDERS = [
    # Bistro — completed and paid
    {
        "id": O1,
        "tenant_id": TENANT_BISTRO,
        "table_id": RT_B1,
        "status": "COMPLETED",
        "total_amount": "67.50",
        "currency": "PLN",
        "created_at": now(offset_days=-1, offset_hours=-3),
        "updated_at": now(offset_days=-1, offset_hours=-1),
    },
    # Bistro — open/in progress
    {
        "id": O2,
        "tenant_id": TENANT_BISTRO,
        "table_id": RT_B2,
        "status": "IN_PROGRESS",
        "total_amount": "43.00",
        "currency": "PLN",
        "created_at": now(offset_hours=-1),
        "updated_at": now(offset_hours=-1),
    },
    # Bistro — pending (just placed)
    {
        "id": O3,
        "tenant_id": TENANT_BISTRO,
        "table_id": RT_B3,
        "status": "PENDING",
        "total_amount": "29.00",
        "currency": "PLN",
        "created_at": now(offset_hours=-0),
        "updated_at": now(offset_hours=-0),
    },
    # Bistro — cancelled
    {
        "id": O4,
        "tenant_id": TENANT_BISTRO,
        "table_id": RT_BT1,
        "status": "CANCELLED",
        "total_amount": "0.00",
        "currency": "PLN",
        "created_at": now(offset_days=-2),
        "updated_at": now(offset_days=-2),
    },
    # Pizza Palace — completed
    {
        "id": O5,
        "tenant_id": TENANT_PIZZA,
        "table_id": RT_P1,
        "status": "COMPLETED",
        "total_amount": "55.00",
        "currency": "PLN",
        "created_at": now(offset_days=-1, offset_hours=-2),
        "updated_at": now(offset_days=-1, offset_hours=-1),
    },
    # Pizza Palace — in progress
    {
        "id": O6,
        "tenant_id": TENANT_PIZZA,
        "table_id": RT_P2,
        "status": "IN_PROGRESS",
        "total_amount": "38.00",
        "currency": "PLN",
        "created_at": now(offset_hours=-2),
        "updated_at": now(offset_hours=-2),
    },
]

ORDER_ITEMS = [
    # O1 — Bistro completed order
    {
        "id": OI1a,
        "order_id": O1,
        "product_id": "prod-bistro-001",
        "name_snapshot": "Duck Confit",
        "quantity": 2,
        "unit_price": "24.50",
        "created_at": now(offset_days=-1, offset_hours=-3),
    },
    {
        "id": OI1b,
        "order_id": O1,
        "product_id": "prod-bistro-005",
        "name_snapshot": "House Red Wine",
        "quantity": 1,
        "unit_price": "12.00",
        "created_at": now(offset_days=-1, offset_hours=-3),
    },
    {
        "id": OI1c,
        "order_id": O1,
        "product_id": "prod-bistro-010",
        "name_snapshot": "Crème Brûlée",
        "quantity": 1,
        "unit_price": "6.50",
        "created_at": now(offset_days=-1, offset_hours=-3),
    },
    # O2 — Bistro in-progress
    {
        "id": OI2a,
        "order_id": O2,
        "product_id": "prod-bistro-002",
        "name_snapshot": "Beef Tartare",
        "quantity": 1,
        "unit_price": "28.00",
        "created_at": now(offset_hours=-1),
    },
    {
        "id": OI2b,
        "order_id": O2,
        "product_id": "prod-bistro-006",
        "name_snapshot": "Sparkling Water",
        "quantity": 3,
        "unit_price": "5.00",
        "created_at": now(offset_hours=-1),
    },
    # O3 — Bistro pending
    {
        "id": OI3a,
        "order_id": O3,
        "product_id": "prod-bistro-003",
        "name_snapshot": "French Onion Soup",
        "quantity": 2,
        "unit_price": "9.50",
        "created_at": now(),
    },
    {
        "id": OI3b,
        "order_id": O3,
        "product_id": "prod-bistro-004",
        "name_snapshot": "Caesar Salad",
        "quantity": 1,
        "unit_price": "7.50",
        "created_at": now(),
    },
    {
        "id": OI3c,
        "order_id": O3,
        "product_id": "prod-bistro-007",
        "name_snapshot": "Espresso",
        "quantity": 2,
        "unit_price": "3.00",
        "created_at": now(),
    },
    # O4 — Bistro cancelled (no items delivered)
    {
        "id": OI4a,
        "order_id": O4,
        "product_id": "prod-bistro-001",
        "name_snapshot": "Duck Confit",
        "quantity": 1,
        "unit_price": "24.50",
        "created_at": now(offset_days=-2),
    },
    {
        "id": OI4b,
        "order_id": O4,
        "product_id": "prod-bistro-005",
        "name_snapshot": "House Red Wine",
        "quantity": 1,
        "unit_price": "12.00",
        "created_at": now(offset_days=-2),
    },
    # O5 — Pizza completed
    {
        "id": OI5a,
        "order_id": O5,
        "product_id": "prod-pizza-001",
        "name_snapshot": "Margherita Pizza",
        "quantity": 2,
        "unit_price": "22.00",
        "created_at": now(offset_days=-1, offset_hours=-2),
    },
    {
        "id": OI5b,
        "order_id": O5,
        "product_id": "prod-pizza-005",
        "name_snapshot": "Cola",
        "quantity": 2,
        "unit_price": "5.50",
        "created_at": now(offset_days=-1, offset_hours=-2),
    },
    # O6 — Pizza in-progress
    {
        "id": OI6a,
        "order_id": O6,
        "product_id": "prod-pizza-002",
        "name_snapshot": "Pepperoni Pizza",
        "quantity": 2,
        "unit_price": "19.00",
        "created_at": now(offset_hours=-2),
    },
]

PAYMENTS = [
    # O1 — paid by card terminal
    {
        "id": PAY1,
        "order_id": O1,
        "provider": "TERMINAL",
        "status": "COMPLETED",
        "amount": "67.50",
        "external_reference": None,
        "created_at": now(offset_days=-1, offset_hours=-1),
        "updated_at": now(offset_days=-1, offset_hours=-1),
    },
    # O2 — pending online payment initiated
    {
        "id": PAY2,
        "order_id": O2,
        "provider": "PRZELEWY24",
        "status": "PENDING",
        "amount": "43.00",
        "external_reference": "P24-20260216-0042",
        "created_at": now(offset_hours=-1),
        "updated_at": now(offset_hours=-1),
    },
    # O4 — cancelled order, failed payment attempt
    {
        "id": PAY3,
        "order_id": O4,
        "provider": "PRZELEWY24",
        "status": "FAILED",
        "amount": "36.50",
        "external_reference": "P24-20260215-0011",
        "created_at": now(offset_days=-2),
        "updated_at": now(offset_days=-2),
    },
    # O5 — Pizza paid cash
    {
        "id": PAY4,
        "order_id": O5,
        "provider": "CASH",
        "status": "COMPLETED",
        "amount": "55.00",
        "external_reference": None,
        "created_at": now(offset_days=-1, offset_hours=-1),
        "updated_at": now(offset_days=-1, offset_hours=-1),
    },
    # O1 — partial refund (e.g., returned wine)
    {
        "id": PAY5,
        "order_id": O1,
        "provider": "TERMINAL",
        "status": "REFUNDED",
        "amount": "12.00",
        "external_reference": None,
        "created_at": now(offset_hours=-2),
        "updated_at": now(offset_hours=-2),
    },
]


# ---------------------------------------------------------------------------
# Insert helpers
# ---------------------------------------------------------------------------


def insert(conn, table: str, rows: list[dict]) -> None:
    if not rows:
        return
    conn.execute(
        text(f"DELETE FROM {table} WHERE id IN :ids"), {"ids": tuple(str(r["id"]) for r in rows)}
    )
    for row in rows:
        # Serialise any dict/list values to JSON strings for JSONB columns
        cleaned = {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
        placeholders = ", ".join(f":{k}" for k in cleaned)
        columns = ", ".join(cleaned.keys())
        conn.execute(text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders})"), cleaned)
    print(f"  ✓  {table}: {len(rows)} rows")  # noqa: T201


def insert_no_id(conn, table: str, rows: list[dict]) -> None:
    """For tables without a simple 'id' PK (e.g. user_tenants composite PK)."""
    if not rows:
        return
    for row in rows:
        cleaned = {k: (json.dumps(v) if isinstance(v, (dict, list)) else v) for k, v in row.items()}
        placeholders = ", ".join(f":{k}" for k in cleaned)
        columns = ", ".join(cleaned.keys())
        conn.execute(
            text(f"INSERT INTO {table} ({columns}) VALUES ({placeholders}) ON CONFLICT DO NOTHING"),
            cleaned,
        )
    print(f"  ✓  {table}: {len(rows)} rows")  # noqa: T201


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def seed() -> None:
    print("\n🌱  Seeding dev fixtures…\n")  # noqa: T201

    with engine.begin() as conn:
        # Disable FK checks temporarily so we can insert in any order
        conn.execute(text("SET session_replication_role = 'replica'"))

        try:
            insert(conn, "tenants", TENANTS)
            insert(conn, "users", USERS)
            insert_no_id(conn, "user_tenants", USER_TENANTS)

            # Venues inserted before canvases; active_layout_version_id set after
            # Insert venues with NULL active layout first to avoid FK chicken-and-egg
            venues_without_layout = [{**v, "active_layout_version_id": None} for v in VENUES]
            insert(conn, "venues", venues_without_layout)
            insert(conn, "floor_canvases", FLOOR_CANVASES)

            # Now patch active_layout_version_id
            for v in VENUES:
                if v["active_layout_version_id"]:
                    conn.execute(
                        text("UPDATE venues SET active_layout_version_id = :lid WHERE id = :vid"),
                        {"lid": v["active_layout_version_id"], "vid": v["id"]},
                    )

            insert(conn, "restaurant_tables", RESTAURANT_TABLES)
            insert(conn, "orders", ORDERS)
            insert(conn, "order_items", ORDER_ITEMS)
            insert(conn, "payments", PAYMENTS)

        finally:
            conn.execute(text("SET session_replication_role = 'origin'"))

    print("\n✅  Done! Here's a quick reference:\n")  # noqa: T201
    print("  Tenant: The Grand Bistro   slug=grand-bistro   (ACTIVE)")  # noqa: T201
    print("  Tenant: Pizza Palace       slug=pizza-palace   (ACTIVE)")  # noqa: T201
    print("  Tenant: Corner Café        slug=corner-cafe    (SUSPENDED)\n")  # noqa: T201
    print("  All user passwords: password123\n")  # noqa: T201
    print("  Bistro logins:")  # noqa: T201
    print("    owner@grand-bistro.dev   — owner,   active")  # noqa: T201
    print("    manager@grand-bistro.dev — manager, active")  # noqa: T201
    print("    waiter1@grand-bistro.dev — waiter,  active")  # noqa: T201
    print("    waiter2@grand-bistro.dev — waiter,  INACTIVE")  # noqa: T201
    print("    kitchen@grand-bistro.dev — kitchen, active")  # noqa: T201
    print("  Pizza logins:")  # noqa: T201
    print("    owner@pizza-palace.dev   — owner,   active")  # noqa: T201
    print("    waiter@pizza-palace.dev  — waiter,  active")  # noqa: T201
    print("    kitchen@pizza-palace.dev — kitchen, active")  # noqa: T201
    print("  Café logins:")  # noqa: T201
    print("    owner@corner-cafe.dev    — owner,   active (suspended tenant)\n")  # noqa: T201
    print("  Order statuses covered: PENDING, IN_PROGRESS, COMPLETED, CANCELLED")  # noqa: T201
    print("  Payment statuses covered: PENDING, COMPLETED, FAILED, REFUNDED")  # noqa: T201
    print("  Payment providers covered: PRZELEWY24, CASH, TERMINAL\n")  # noqa: T201


if __name__ == "__main__":
    seed()
