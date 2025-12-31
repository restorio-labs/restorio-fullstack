# Architecture Alignment with Design Choices

## ✅ Alignment Status

This document confirms that the PostgreSQL implementation aligns with the design choices specified in the architecture document.

## Design Choice Compliance

### 1. ✅ Modular Monolith
- **Status**: Aligned
- **Implementation**: Single FastAPI app with clear module boundaries
- **Structure**: `apps/api/modules/` with domain separation (auth, tenants, restaurants, orders)

### 2. ✅ Two DB Connections + Logical Separation
- **Status**: Aligned
- **Implementation**:
  - `core/db.py` - MongoDB connection (Motor)
  - `core/database.py` - PostgreSQL connection (SQLAlchemy async)
- **Separation**: Each module depends only on what it needs

### 3. ✅ ORM Usage (SQLAlchemy 2.0)
- **Status**: ✅ **NOW ALIGNED**
- **Implementation**:
  - **SQL Migrations**: Raw SQL in `migrations/001_initial_schema.sql` (for schema creation)
  - **ORM Models**: SQLAlchemy 2.0 models in `core/models.py` (for application code)
  - **DTOs**: Pydantic models in `core/postgres_models.py` (for API layer)
- **Separation**: 
  ```
  Pydantic DTO → Domain Logic → SQLAlchemy ORM Model → PostgreSQL
  ```

### 4. ✅ Mongo → PostgreSQL Order Handover
- **Status**: Aligned
- **Implementation**: 
  - MongoDB stores draft orders, live sessions
  - PostgreSQL stores only finalized, immutable orders
  - Schema supports this with `orders` table for finalized state only

### 5. ✅ Multi-tenancy with tenant_id
- **Status**: Aligned
- **Implementation**: All business tables include `tenant_id` foreign key
- **Strategy**: Shared database, tenant isolation via `tenant_id`

### 6. ✅ API Versioning
- **Status**: Aligned
- **Implementation**: `/api/v1/` prefix already configured

### 7. ✅ Cross-Database References
- **Status**: Aligned
- **Pattern**: PostgreSQL IDs stored in MongoDB documents (not vice versa)
- **Example**: MongoDB order drafts reference `restaurantId` (UUID from PostgreSQL)

## Architecture Layers

### Layer 1: API DTOs (Pydantic)
**File**: `core/postgres_models.py`
- Purpose: API request/response validation
- Used by: FastAPI route handlers
- Example: `OrderCreate`, `Order`, `TenantCreate`

### Layer 2: Domain Logic
**Location**: `modules/*/`
- Purpose: Business logic, validation, orchestration
- Uses: ORM models and DTOs

### Layer 3: ORM Models (SQLAlchemy)
**File**: `core/models.py`
- Purpose: Database persistence layer
- Used by: Domain logic modules
- Example: `Order`, `Tenant`, `User`

### Layer 4: Database Schema (SQL)
**File**: `migrations/001_initial_schema.sql`
- Purpose: Schema definition and migrations
- Used by: Migration runner

## Database Connection Strategy

### PostgreSQL
```python
# SQLAlchemy async session (recommended for application code)
from core.dependencies import PostgresSession
from sqlalchemy.ext.asyncio import AsyncSession

async def my_route(db: PostgresSession):
    # Use ORM models
    order = await db.get(Order, order_id)
```

### MongoDB
```python
# Motor client (for document operations)
from core.dependencies import MongoDB
from motor.motor_asyncio import AsyncIOMotorDatabase

async def my_route(db: MongoDB):
    # Use MongoDB collections
    menu = await db.menus.find_one({"restaurantId": tenant_id})
```

## Why This Approach is Academically Sound

1. **Separation of Concerns**: Clear boundaries between API, domain, and persistence
2. **ORM Benefits**: Type safety, relationship management, query building
3. **Not Over-Engineering**: Using industry-standard tools (SQLAlchemy) is expected
4. **Maintainability**: ORM reduces boilerplate while maintaining flexibility
5. **Testability**: ORM models can be easily mocked/tested

## Migration Strategy

- **SQL Migrations**: Used for schema changes (DDL)
- **ORM Models**: Used for application code (DML)
- **Alembic** (optional future): Can be added for migration management if needed

## Next Steps

1. ✅ SQLAlchemy 2.0 added to dependencies
2. ✅ ORM models created for all tables
3. ✅ Async session dependency created
4. ⏭️ Update existing code to use ORM instead of raw asyncpg
5. ⏭️ Add repository pattern (optional, for additional abstraction)

## References

- Design Document: See attached `Untitled-2` for full design choices
- SQLAlchemy 2.0 Docs: https://docs.sqlalchemy.org/en/20/
- FastAPI + SQLAlchemy: https://fastapi.tiangolo.com/tutorial/sql-databases/

