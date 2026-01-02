# Models Directory Structure

This directory contains SQLAlchemy ORM models, split into separate files for better maintainability and organization.

## File Organization

```
models/
├── __init__.py          # Exports all models and enums
├── enums.py             # All enum types (TenantStatus, OrderStatus, etc.)
├── tenant.py            # Tenant model
├── user.py              # User model
├── user_tenant.py       # UserTenant junction model
├── restaurant_table.py  # RestaurantTable model
├── order.py             # Order model
├── order_item.py        # OrderItem model
├── payment.py           # Payment model
└── audit_log.py         # AuditLog model
```

## Usage

All models can be imported from the package:

```python
from core.models import (
    Tenant,
    User,
    UserTenant,
    RestaurantTable,
    Order,
    OrderItem,
    Payment,
    AuditLog,
    TenantStatus,
    OrderStatus,
    PaymentProvider,
    PaymentStatus,
)
```

Or import individual models:

```python
from core.models.order import Order
from core.models.enums import OrderStatus
```

## Relationships

All relationships use string references to avoid circular imports:

```python
# In tenant.py
orders: Mapped[list[Order]] = relationship(...)

# In order.py
tenant: Mapped[Tenant] = relationship(...)
```

This allows SQLAlchemy to resolve relationships at runtime.

## Base Class

All models inherit from `Base` defined in `core.database`:

```python
from core.database import Base

class Tenant(Base):
    ...
```
