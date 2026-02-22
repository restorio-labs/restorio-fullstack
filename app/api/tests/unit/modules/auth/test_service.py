from datetime import UTC, datetime, timedelta
from uuid import uuid4

import pytest

from core.exceptions import (
    BadRequestError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
    UnauthorizedError,
)
from core.foundation.security import SecurityService
from core.models.activation_link import ActivationLink
from core.models.enums import TenantStatus
from core.models.tenant import Tenant
from core.models.user import User
from services.auth_service import AuthService

auth_service = AuthService(security=SecurityService())
EXPECTED_NEW_LINK_COUNT = 2


class FakeAsyncSession:
    def __init__(self) -> None:
        self.users: list[User] = []
        self.tenants: list[Tenant] = []
        self.activation_links: list[ActivationLink] = []
        self.added_objects: list[object] = []

    async def scalar(self, query: object) -> User | None:
        query_str = str(query)
        query_params: dict[str, object] = {}
        if hasattr(query, "compile"):
            query_params = query.compile().params

        if "users.email" in query_str:
            email = next(iter(query_params.values()), None)
            return next((u for u in self.users if u.email == email), None)
        return None

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
            if isinstance(obj, ActivationLink):
                if not hasattr(obj, "id") or obj.id is None:
                    obj.id = uuid4()
                self.activation_links.append(obj)
        self.added_objects.clear()

    async def refresh(self, obj: object) -> None:
        pass


@pytest.mark.asyncio
async def test_create_activation_link_success() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="hash",
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

    link = await auth_service.create_activation_link(
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
        await auth_service.activate_account(session=session, activation_id=unknown_id)

    assert str(unknown_id) in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_link_expired() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
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
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "expired" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_activate_account_tenant_not_found() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
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
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_activate_account_already_activated_returns_tenant_true() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
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

    result_tenant, already = await auth_service.activate_account(
        session=session, activation_id=link.id
    )

    assert result_tenant.id == tenant.id
    assert already is True


@pytest.mark.asyncio
async def test_activate_account_success_activates_user_and_tenant() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="u@example.com",
        password_hash="h",
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

    result_tenant, already = await auth_service.activate_account(
        session=session, activation_id=link.id
    )

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
        await auth_service.activate_account(session=session, activation_id=link.id)

    assert "Account" in exc_info.value.detail


@pytest.mark.asyncio
async def test_resend_activation_link_not_found() -> None:
    session = FakeAsyncSession()
    unknown_id = uuid4()

    with pytest.raises(NotFoundError) as exc_info:
        await auth_service.resend_activation_link(session=session, activation_id=unknown_id)

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
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

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
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

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
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

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
        await auth_service.resend_activation_link(session=session, activation_id=link.id)

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

    new_link, result_tenant = await auth_service.resend_activation_link(
        session=session, activation_id=link.id
    )

    assert new_link.id is not None
    assert new_link.id != link.id
    assert new_link.email == link.email
    assert new_link.user_id == link.user_id
    assert new_link.tenant_id == link.tenant_id
    assert result_tenant.id == tenant.id
    assert len(session.activation_links) == EXPECTED_NEW_LINK_COUNT
    assert link.last_resend_at is not None


@pytest.mark.asyncio
async def test_login_success_returns_jwt_with_claims() -> None:
    session = FakeAsyncSession()
    tenant_id = uuid4()
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        tenant_id=tenant_id,
        is_active=True,
    )
    session.users.append(user)

    access_token = await auth_service.login(
        session=session,
        email="owner@example.com",
        password="my_password_123",
    )

    assert isinstance(access_token, str)
    decoded = auth_service.security.decode_access_token(access_token)
    assert decoded is not None
    assert decoded["sub"] == str(user.id)
    assert decoded["email"] == user.email
    assert decoded["tenant_id"] == str(tenant_id)


@pytest.mark.asyncio
async def test_login_invalid_credentials() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        is_active=True,
    )
    session.users.append(user)

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="owner@example.com",
            password="wrong-password",
        )

    assert "invalid credentials" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_login_inactive_account() -> None:
    session = FakeAsyncSession()
    user = User(
        id=uuid4(),
        email="owner@example.com",
        password_hash=auth_service.security.hash_password("my_password_123"),
        is_active=False,
    )
    session.users.append(user)

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="owner@example.com",
            password="my_password_123",
        )

    assert "not active" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_login_user_not_found() -> None:
    session = FakeAsyncSession()

    with pytest.raises(UnauthorizedError) as exc_info:
        await auth_service.login(
            session=session,
            email="missing@example.com",
            password="my_password_123",
        )

    assert "invalid credentials" in exc_info.value.detail.lower()
