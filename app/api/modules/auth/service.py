from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import (
    BadRequestError,
    ConflictError,
    GoneError,
    NotFoundError,
    TooManyRequestsError,
    UnauthorizedError,
)
from core.foundation.infra.config import settings
from core.foundation.security import create_access_token, hash_password, verify_password
from core.models.activation_link import ActivationLink
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User
from core.models.user_tenant import UserTenant


async def create_user_with_tenant(
    *,
    session: AsyncSession,
    email: str,
    password: str,
    restaurant_name: str,
) -> tuple[User, Tenant, TenantRole]:
    slug = "".join(restaurant_name.split()).lower()

    existing_user = await session.scalar(select(User).where(User.email == email))
    if existing_user:
        msg = "Email already registered"
        raise ConflictError(msg)

    existing_tenant = await session.scalar(select(Tenant).where(Tenant.slug == slug))
    if existing_tenant:
        msg = "Restaurant slug already exists"
        raise ConflictError(msg)

    user = User(
        email=email,
        password_hash=hash_password(password),
        is_active=False,
    )
    tenant = Tenant(
        name=restaurant_name,
        slug=slug,
        status=TenantStatus.INACTIVE,
    )

    session.add_all([user, tenant])
    await session.flush()
    user.tenant_id = tenant.id
    tenant.owner_id = user.id
    await session.flush()
    await session.refresh(user)
    await session.refresh(tenant)

    user_tenant = UserTenant(
        user_id=user.id,
        tenant_id=tenant.id,
        role=AccountType.OWNER,
    )
    tenant_role = TenantRole(
        account_id=user.id,
        tenant_id=tenant.id,
        account_type=AccountType.OWNER,
    )
    session.add_all([user_tenant, tenant_role])
    await session.flush()

    return user, tenant, tenant_role


async def create_activation_link(
    *,
    session: AsyncSession,
    email: str,
    user_id: UUID,
    tenant_id: UUID,
) -> ActivationLink:
    activation_link = ActivationLink(
        email=email,
        user_id=user_id,
        tenant_id=tenant_id,
        expires_at=datetime.now(tz=UTC) + timedelta(hours=24),
    )
    session.add(activation_link)
    await session.flush()
    await session.refresh(activation_link)
    return activation_link


async def activate_account(
    *,
    session: AsyncSession,
    activation_id: UUID,
) -> tuple[Tenant, bool]:
    """Returns (tenant, already_activated)."""
    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is None:
        msg = "Activation link not found"
        raise NotFoundError(msg, str(activation_id))

    now = datetime.now(tz=UTC)
    if activation_link.expires_at < now:
        msg = "Activation link has expired"
        raise GoneError(msg)

    tenant = await session.get(Tenant, activation_link.tenant_id)
    if tenant is None:
        msg = "Account"
        raise NotFoundError(msg, "activation link")

    if activation_link.used_at is not None:
        return tenant, True

    user = await session.get(User, activation_link.user_id)
    if user is None:
        msg = "Account"
        raise NotFoundError(msg, "activation link")
    user.is_active = True
    tenant.status = TenantStatus.ACTIVE
    activation_link.used_at = now
    return tenant, False


RESEND_COOLDOWN_SECONDS = 300


async def resend_activation_link(
    *,
    session: AsyncSession,
    activation_id: UUID,
) -> tuple[ActivationLink, Tenant]:
    """Resend only when link is expired. Cooldown is per activation link (last_resend_at)."""
    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is None:
        msg = "Activation link"
        raise NotFoundError(msg, str(activation_id))

    now = datetime.now(tz=UTC)
    if activation_link.used_at is not None:
        msg = "Account already activated"
        raise BadRequestError(msg)
    if activation_link.expires_at >= now:
        msg = "Activation link has not expired yet"
        raise BadRequestError(msg)

    if activation_link.last_resend_at is not None:
        elapsed = (now - activation_link.last_resend_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            msg = "Please wait before requesting another activation email."
            raise TooManyRequestsError(msg)

    activation_link.last_resend_at = now
    tenant = await session.get(Tenant, activation_link.tenant_id)
    if tenant is None:
        msg = "Account"
        raise NotFoundError(msg, "activation link")

    new_link = ActivationLink(
        email=activation_link.email,
        user_id=activation_link.user_id,
        tenant_id=activation_link.tenant_id,
        expires_at=now + timedelta(hours=24),
    )
    session.add(new_link)
    await session.flush()
    await session.refresh(new_link)
    return new_link, tenant


async def login_user(
    *,
    session: AsyncSession,
    email: str,
    password: str,
) -> tuple[str, int]:
    user = await session.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(password, user.password_hash):
        msg = "Invalid credentials"
        raise UnauthorizedError(msg)

    if not user.is_active:
        msg = "Account is not active"
        raise UnauthorizedError(msg)

    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "tenant_id": str(user.tenant_id) if user.tenant_id else None,
        }
    )
    return access_token, expires_in_seconds
