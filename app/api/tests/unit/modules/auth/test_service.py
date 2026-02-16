from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from core.exceptions import (
    BadRequestError,
    ConflictError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
)
from core.models.activation_link import ActivationLink
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.user import User
from core.models.user_tenant import UserTenant
from modules.auth.service import (
    activate_account,
    create_activation_link,
    create_user_with_tenant,
    resend_activation_link,
)

PASSWORD_HASH_MIN_LENGTH = 50
EXPECTED_NEW_LINK_COUNT = 2


class FakeAsyncSession:
    def __init__(self) -> None:
        self.users: list[User] = []
        self.tenants: list[Tenant] = []
        self.user_tenants: list[UserTenant] = []
        self.activation_links: list[ActivationLink] = []
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

    async def get(self, entity_cls: type, pk: object) -> object | None:
        if entity_cls is ActivationLink:
            return next((a for a in self.activation_links if a.id == pk), None)
        if entity_cls is User:
            return next((u for u in self.users if u.id == pk), None)
        if entity_cls is Tenant:
            return next((t for t in self.tenants if t.id == pk), None)
        return None

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
            elif isinstance(obj, ActivationLink):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.activation_links.append(obj)
            elif isinstance(obj, UserTenant):
                self.user_tenants.append(obj)
        self.added_objects.clear()

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


@pytest.mark.asyncio
async def test_create_activation_link_success() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="hash",
        account_type=AccountType.OWNER,
        is_active=False,
    )
    tenant = Tenant(
        id=uuid4(),
        name="Rest",
        slug="rest",
        status=TenantStatus.INACTIVE,
    )
    session.users.append(user)
    session.tenants.append(tenant)

    link = await create_activation_link(
        session=session,
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
    )

    assert link.id is not None
    assert link.email == user.email
    assert link.user_id == user.id
    assert link.tenant_id == tenant.id
    assert link.expires_at is not None
    assert link.used_at is None
    assert len(session.activation_links) == 1
    assert session.activation_links[0].id == link.id


@pytest.mark.asyncio
async def test_activate_account_link_not_found() -> None:
    session = FakeAsyncSession()
    unknown_id = uuid4()

    with pytest.raises(NotFoundError) as exc_info:
        await activate_account(session=session, activation_id=unknown_id)

    assert str(unknown_id) in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_link_expired() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        account_type=AccountType.OWNER,
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(GoneError) as exc_info:
        await activate_account(session=session, activation_id=link.id)

    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_activate_account_tenant_not_found() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        account_type=AccountType.OWNER,
        is_active=False,
    )
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=uuid4(),
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.users.append(user)
    session.activation_links.append(link)

    with pytest.raises(NotFoundError) as exc_info:
        await activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_already_activated_returns_tenant_true() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        account_type=AccountType.OWNER,
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.ACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
        used_at=datetime.now(tz=UTC),
    )
    session.activation_links.append(link)

    result_tenant, already = await activate_account(session=session, activation_id=link.id)

    assert result_tenant.id == tenant.id
    assert already is True


@pytest.mark.asyncio
async def test_activate_account_success_activates_user_and_tenant() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
        account_type=AccountType.OWNER,
        is_active=False,
    )
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.users.append(user)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    result_tenant, already = await activate_account(session=session, activation_id=link.id)

    assert result_tenant.id == tenant.id
    assert already is False
    assert user.is_active is True
    assert tenant.status == TenantStatus.ACTIVE
    assert link.used_at is not None


@pytest.mark.asyncio
async def test_activate_account_user_not_found() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(NotFoundError) as exc_info:
        await activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_not_found() -> None:
    session = FakeAsyncSession()
    unknown_id = uuid4()

    with pytest.raises(NotFoundError) as exc_info:
        await resend_activation_link(session=session, activation_id=unknown_id)

    assert str(unknown_id) in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_already_activated() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.ACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
        used_at=datetime.now(tz=UTC),
    )
    session.activation_links.append(link)

    with pytest.raises(BadRequestError) as exc_info:
        await resend_activation_link(session=session, activation_id=link.id)

    assert "already activated" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_not_expired_yet() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(BadRequestError) as exc_info:
        await resend_activation_link(session=session, activation_id=link.id)

    assert "not expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_cooldown() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
        last_resend_at=datetime.now(tz=UTC) - timedelta(seconds=60),
    )
    session.activation_links.append(link)

    with pytest.raises(TooManyRequestsError) as exc_info:
        await resend_activation_link(session=session, activation_id=link.id)

    assert "wait" in exc_info.value.detail.lower() or "email" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_resend_activation_link_tenant_not_found() -> None:
    session = FakeAsyncSession()
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=uuid4(),
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    with pytest.raises(NotFoundError) as exc_info:
        await resend_activation_link(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_success_creates_new_link() -> None:
    session = FakeAsyncSession()
    tenant = Tenant(id=uuid4(), name="T", slug="t", status=TenantStatus.INACTIVE)
    session.tenants.append(tenant)
    link = ActivationLink(
        id=uuid4(),
        email="u@example.com",
        user_id=uuid4(),
        tenant_id=tenant.id,
        expires_at=datetime.now(tz=UTC) - timedelta(hours=1),
    )
    session.activation_links.append(link)

    new_link, result_tenant = await resend_activation_link(session=session, activation_id=link.id)

    assert new_link.id is not None
    assert new_link.id != link.id
    assert new_link.email == link.email
    assert new_link.user_id == link.user_id
    assert new_link.tenant_id == link.tenant_id
    assert result_tenant.id == tenant.id
    assert len(session.activation_links) == EXPECTED_NEW_LINK_COUNT
    assert link.last_resend_at is not None
