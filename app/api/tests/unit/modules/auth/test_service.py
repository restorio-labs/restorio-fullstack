from uuid import uuid4

import pytest

from core.exceptions import ConflictError
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.user import User
from core.models.user_tenant import UserTenant
from modules.auth.service import create_user_with_tenant

PASSWORD_HASH_MIN_LENGTH = 50


class FakeAsyncSession:
    def __init__(self) -> None:
        self.users: list[User] = []
        self.tenants: list[Tenant] = []
        self.user_tenants: list[UserTenant] = []
        self.added_objects: list[object] = []

    async def scalar(self, query: object) -> User | Tenant | None:
        query_str = str(query)
        if "users.email" in query_str:
            return next((u for u in self.users), None)
        if "tenants.slug" in query_str:
            return next((t for t in self.tenants), None)
        return None

    def add_all(self, objects: list[object]) -> None:
        self.added_objects.extend(objects)

    def add(self, obj: object) -> None:
        self.added_objects.append(obj)

    async def flush(self) -> None:
        for obj in self.added_objects:
            if isinstance(obj, User):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.users.append(obj)
            elif isinstance(obj, Tenant):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.tenants.append(obj)
            elif isinstance(obj, UserTenant):
                self.user_tenants.append(obj)

    async def refresh(self, obj: object) -> None:
        pass


@pytest.mark.asyncio
async def test_create_user_with_tenant_success() -> None:
    session = FakeAsyncSession()

    user, tenant = await create_user_with_tenant(
        session=session,
        email="owner@example.com",
        password="secure_password",
        restaurant_name="My Restaurant",
    )

    assert user is not None
    assert user.email == "owner@example.com"
    assert user.account_type == AccountType.OWNER
    assert user.is_active is False
    assert user.password_hash != "secure_password"
    assert len(user.password_hash) > 0

    assert tenant is not None
    assert tenant.name == "My Restaurant"
    assert tenant.slug == "myrestaurant"
    assert tenant.status == TenantStatus.INACTIVE

    assert len(session.user_tenants) == 1
    user_tenant = session.user_tenants[0]
    assert user_tenant.user_id == user.id
    assert user_tenant.tenant_id == tenant.id
    assert user_tenant.role == AccountType.OWNER


@pytest.mark.asyncio
async def test_create_user_with_tenant_slug_generation() -> None:
    session = FakeAsyncSession()

    test_cases = [
        ("My Restaurant", "myrestaurant"),
        ("The Best Pizza", "thebestpizza"),
        ("Café Délice", "cafédélice"),
        ("Restaurant   With   Spaces", "restaurantwithspaces"),
        ("A", "a"),
    ]

    for restaurant_name, expected_slug in test_cases:
        session = FakeAsyncSession()
        _, tenant = await create_user_with_tenant(
            session=session,
            email=f"owner{expected_slug}@example.com",
            password="password",
            restaurant_name=restaurant_name,
        )
        assert tenant.slug == expected_slug


@pytest.mark.asyncio
async def test_create_user_with_tenant_duplicate_email() -> None:
    session = FakeAsyncSession()

    existing_user = User(
        id=uuid4(),
        email="existing@example.com",
        password_hash="hashed",
        account_type=AccountType.OWNER,
        is_active=True,
    )
    session.users.append(existing_user)

    with pytest.raises(ConflictError) as exc_info:
        await create_user_with_tenant(
            session=session,
            email="existing@example.com",
            password="password",
            restaurant_name="New Restaurant",
        )

    assert "Email already registered" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_user_with_tenant_duplicate_slug() -> None:
    session = FakeAsyncSession()

    existing_tenant = Tenant(
        id=uuid4(),
        name="Existing Restaurant",
        slug="myrestaurant",
        status=TenantStatus.ACTIVE,
    )
    session.tenants.append(existing_tenant)

    with pytest.raises(ConflictError) as exc_info:
        await create_user_with_tenant(
            session=session,
            email="newowner@example.com",
            password="password",
            restaurant_name="My Restaurant",
        )

    assert "Restaurant slug already exists" in str(exc_info.value)


@pytest.mark.asyncio
async def test_create_user_with_tenant_password_is_hashed() -> None:
    session = FakeAsyncSession()

    plain_password = "my_secure_password_123"

    user, _ = await create_user_with_tenant(
        session=session,
        email="test@example.com",
        password=plain_password,
        restaurant_name="Test Restaurant",
    )

    assert user.password_hash != plain_password
    assert user.password_hash.startswith("$2b$")
    assert len(user.password_hash) > PASSWORD_HASH_MIN_LENGTH


@pytest.mark.asyncio
async def test_create_user_with_tenant_user_tenant_relationship() -> None:
    session = FakeAsyncSession()

    user, tenant = await create_user_with_tenant(
        session=session,
        email="owner@example.com",
        password="password",
        restaurant_name="Test Restaurant",
    )

    assert len(session.user_tenants) == 1

    user_tenant = session.user_tenants[0]
    assert user_tenant.user_id == user.id
    assert user_tenant.tenant_id == tenant.id
    assert user_tenant.role == AccountType.OWNER
