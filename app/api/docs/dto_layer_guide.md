# DTO Layer Implementation Guide

## Overview

This document describes the Data Transfer Object (DTO) layer implementation for the Restorio API v1. The DTO layer serves as the formal contract between the backend and its consumers (frontend, SDK clients).

## Architecture

### Separation of Concerns

The Restorio API implements a clear separation between three layers:

1. **ORM Models** (`core/models/`): SQLAlchemy models for database persistence
2. **DTOs** (`api/v1/dto/`): API contract for request/response validation
3. **Domain Logic** (`modules/`): Business logic implementation

This separation provides:

- **Independence**: Database schema changes don't force API changes
- **Validation**: Explicit validation at API boundaries
- **Versioning**: Support for API evolution without breaking changes
- **Testability**: Each layer can be tested independently

### DTO vs ORM Models

| Aspect | ORM Models | DTOs |
|--------|------------|------|
| Location | `core/models/` | `api/v1/dto/` |
| Purpose | Database persistence | API contract |
| Dependencies | SQLAlchemy | Pydantic |
| Relationships | Foreign keys, joins | Nested DTOs |
| Validation | Database constraints | Pydantic validators |

## Directory Structure

```
api/v1/dto/
├── common/               # Shared types and base classes
│   ├── base.py          # BaseDTO class
│   ├── enums.py         # Status enums
│   └── types.py         # Common type aliases
├── tenants/             # Tenant DTOs
│   ├── requests.py      # CreateTenantDTO, UpdateTenantDTO
│   └── responses.py     # TenantResponseDTO
├── orders/              # Order DTOs
│   ├── requests.py      # CreateOrderDTO, UpdateOrderDTO
│   └── responses.py     # OrderResponseDTO
├── menus/               # Menu DTOs
│   ├── requests.py      # CreateMenuItemDTO
│   └── responses.py     # MenuItemDTO
├── payments/            # Payment DTOs
│   ├── requests.py      # CreatePaymentDTO, UpdatePaymentDTO
│   └── responses.py     # PaymentResponseDTO
└── restaurants/         # Restaurant DTOs
    ├── requests.py      # CreateRestaurantTableDTO
    └── responses.py     # RestaurantTableResponseDTO
```

## Common DTOs

### BaseDTO

All DTOs inherit from `BaseDTO`:

```python
from core.dto.v1.common import BaseDTO

class MyDTO(BaseDTO):
    field: str
```

Features:
- `from_attributes=True`: Enables ORM model conversion
- `str_strip_whitespace=True`: Automatic whitespace trimming
- `validate_assignment=True`: Validates field updates

### Enums

Shared status enums:
- `TenantStatus`: ACTIVE, SUSPENDED, INACTIVE
- `OrderStatus`: PLACED, PAID, CANCELLED
- `PaymentProvider`: PRZELEWY24, TERMINAL, CASH, OTHER
- `PaymentStatus`: PENDING, COMPLETED, FAILED, REFUNDED

### Type Aliases

Common type aliases:
- `EntityId`: UUID with validation
- `CurrencyCode`: 3-letter uppercase currency code

## DTO Patterns

### Request DTOs

Request DTOs validate incoming data:

```python
class CreateTenantDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., pattern="^[a-z0-9-]+$")
    status: TenantStatus = TenantStatus.ACTIVE
```

### Update DTOs

Update DTOs use optional fields for partial updates:

```python
class UpdateTenantDTO(BaseDTO):
    name: str | None = None
    slug: str | None = None
    status: TenantStatus | None = None
```

### Response DTOs

Response DTOs shape outgoing data:

```python
class TenantResponseDTO(BaseDTO):
    id: EntityId
    name: str
    slug: str
    status: TenantStatus
    created_at: datetime
```

## Usage Examples

### In Route Handlers

```python
from core.dto.v1.tenants import CreateTenantDTO, TenantResponseDTO

@router.post("")
async def create_tenant(
    request: CreateTenantDTO
) -> CreatedResponse[TenantResponseDTO]:
    # request is automatically validated
    # Convert DTO to ORM model
    tenant = Tenant(**request.model_dump())
    # ... save to database ...
    # Convert ORM model to response DTO
    return CreatedResponse(
        data=TenantResponseDTO.model_validate(tenant)
    )
```

### Converting Between Layers

#### DTO → ORM Model

```python
# Explicit field mapping
tenant = Tenant(
    name=dto.name,
    slug=dto.slug,
    status=TenantStatus(dto.status)
)

# Or use model_dump()
tenant = Tenant(**dto.model_dump())
```

#### ORM Model → DTO

```python
# Using model_validate()
dto = TenantResponseDTO.model_validate(tenant)

# Or explicit construction
dto = TenantResponseDTO(
    id=tenant.id,
    name=tenant.name,
    slug=tenant.slug,
    status=tenant.status,
    created_at=tenant.created_at
)
```

## Validation

### Field Constraints

DTOs use Pydantic Field validators:

```python
class CreateOrderItemDTO(BaseDTO):
    product_id: str = Field(..., min_length=1)
    quantity: int = Field(..., gt=0)
    modifiers: list[str] = Field(default_factory=list)
```

### Custom Validation

For complex validation, use validators:

```python
from pydantic import field_validator

class MyDTO(BaseDTO):
    email: str

    @field_validator('email')
    @classmethod
    def validate_email(cls, v: str) -> str:
        if not v.endswith('@example.com'):
            raise ValueError('Must be company email')
        return v
```

## Testing DTOs

All DTOs have comprehensive unit tests in `tests/unit/api/`:

```python
def test_create_tenant_dto():
    dto = CreateTenantDTO(
        name="Test Restaurant",
        slug="test-restaurant"
    )
    assert dto.name == "Test Restaurant"
    assert dto.status == TenantStatus.ACTIVE
```

Run DTO tests:

```bash
uv run pytest tests/unit/api/ -v
```

## API Versioning

All DTOs belong to API v1 (`api/v1/dto/`).

For breaking changes:
1. Create new DTO in v2 directory
2. Update route to use new version
3. Maintain v1 for backward compatibility

Path-based versioning:
- v1: `/api/v1/tenants`
- v2: `/api/v2/tenants`

## Best Practices

### DO ✅

- Use descriptive field names
- Add field descriptions for documentation
- Validate constraints at DTO level
- Use type aliases for common types
- Keep DTOs simple and focused
- Write comprehensive tests

### DON'T ❌

- Reference ORM models in DTOs
- Add business logic to DTOs
- Use DTOs for internal service communication
- Reuse DTOs across API versions
- Skip validation for "trusted" input

## Migration from postgres_models.py

The legacy `postgres_models.py` file has been deprecated. Use:

- **For ORM operations**: `core.models.*`
- **For API endpoints**: `core.dto.v1.*`

See deprecation notice in `core/foundation/database/postgres_models.py`.

## Examples by Module

### Tenants

```python
# Create tenant
dto = CreateTenantDTO(name="Pizza Place", slug="pizza-place")

# Update tenant
dto = UpdateTenantDTO(status=TenantStatus.SUSPENDED)

# Response
dto = TenantResponseDTO(id=uuid, name="Pizza Place", ...)
```

### Orders

```python
# Create order with items
dto = CreateOrderDTO(
    table_id=table_uuid,
    items=[
        CreateOrderItemDTO(product_id="pizza-1", quantity=2),
        CreateOrderItemDTO(product_id="drink-1", quantity=1)
    ]
)
```

### Payments

```python
# Create payment
dto = CreatePaymentDTO(
    order_id=order_uuid,
    provider=PaymentProvider.PRZELEWY24,
    amount=Decimal("99.99")
)
```

## Further Reading

- [Architecture Alignment](./architecture_alignment.md)
- [PostgreSQL Schema](./postgres_schema.md)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic V2 Documentation](https://docs.pydantic.dev/latest/)
