from uuid import uuid4

import pytest

from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from services.tenant_service import TenantService


@pytest.mark.asyncio
async def test_list_tenants_accepts_user_id_and_returns_list() -> None:
    service = TenantService()
    user_id = uuid4()

    async def fake_execute(_self: object, query: object) -> object:
        result = type("Result", (), {})()
        result.scalars = lambda: type("Scalars", (), {"all": lambda _s: []})()
        return result

    class FakeSession:
        execute = fake_execute

    session = FakeSession()
    tenants = await service.list_tenants(session, user_id)

    assert tenants == []


@pytest.mark.asyncio
async def test_list_tenants_returns_tenants_from_execute_result() -> None:
    service = TenantService()
    user_id = uuid4()
    tenant = Tenant(
        id=uuid4(),
        name="Test Tenant",
        slug="test-tenant",
        status=TenantStatus.ACTIVE,
    )

    async def fake_execute(_self: object, query: object) -> object:
        result = type("Result", (), {})()
        result.scalars = lambda: type("Scalars", (), {"all": lambda _s: [tenant]})()
        return result

    class FakeSession:
        execute = fake_execute

    session = FakeSession()
    tenants = await service.list_tenants(session, user_id)

    assert len(tenants) == 1
    assert tenants[0].id == tenant.id
    assert tenants[0].name == tenant.name
