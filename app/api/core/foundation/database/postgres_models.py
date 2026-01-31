"""
DEPRECATED: This module is deprecated and will be removed in a future version.

This file originally contained Pydantic models that mixed concerns between
DTOs and ORM representation. These have been replaced by:

1. ORM Models: Located in `core/models/` directory
   - These are SQLAlchemy models for database persistence
   - Examples: core/models/tenant.py, core/models/order.py

2. DTOs (Data Transfer Objects): Located in `api/v1/dto/` directory
   - These are the API contract for v1 endpoints
   - Separated into request and response DTOs
   - Examples: api/v1/dto/tenants/, api/v1/dto/orders/

Migration Guide:
- For ORM operations: Use models from `core.models`
- For API endpoints: Use DTOs from `api.v1.dto`

Architectural Benefits:
- Clear separation between persistence and API layers
- Independent evolution of database schema and API contracts
- Explicit validation at API boundaries
- Support for API versioning
"""
