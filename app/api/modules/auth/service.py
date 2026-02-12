from fastapi import HTTPException, status
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictError
from core.foundation.security import hash_password
from core.models.enums import AccountType, TenantStatus
from core.models.activation_link import ActivationLink
from core.models.tenant import Tenant
from core.models.user import User
from core.models.user_tenant import UserTenant


async def create_user_with_tenant(
    *,
    session: AsyncSession,
    email: str,
    password: str,
    restaurant_name: str,
) -> tuple[User, Tenant]:
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
        account_type=AccountType.OWNER,
        is_active=False,
    )
    tenant = Tenant(
        name=restaurant_name,
        slug=slug,
        status=TenantStatus.INACTIVE,
    )

    session.add_all([user, tenant])
    await session.flush()
    await session.refresh(user)
    await session.refresh(tenant)

    user_tenant = UserTenant(
        user_id=user.id,
        tenant_id=tenant.id,
        role=AccountType.OWNER,
    )
    session.add(user_tenant)
    await session.flush()

    return user, tenant


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
        expires_at=datetime.now(tz=timezone.utc) + timedelta(hours=24),
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
    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation link not found",
        )

    now = datetime.now(tz=timezone.utc)
    if activation_link.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Activation link has expired",
        )

    tenant = await session.get(Tenant, activation_link.tenant_id)
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found for activation link",
        )

    if activation_link.used_at is not None:
        return tenant, True

    user = await session.get(User, activation_link.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found for activation link",
        )
    user.is_active = True
    tenant.status = TenantStatus.ACTIVE
    activation_link.used_at = now
    await session.commit()
    return tenant, False


RESEND_COOLDOWN_SECONDS = 300


async def resend_activation_link(
    *,
    session: AsyncSession,
    activation_id: UUID,
) -> tuple[ActivationLink, Tenant]:
    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activation link not found",
        )

    now = datetime.now(tz=timezone.utc)
    if activation_link.used_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account already activated",
        )
    if activation_link.expires_at >= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Activation link has not expired yet",
        )

    if activation_link.last_resend_at is not None:
        elapsed = (now - activation_link.last_resend_at).total_seconds()
        if elapsed < RESEND_COOLDOWN_SECONDS:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait before requesting another activation email.",
            )

    activation_link.last_resend_at = now
    tenant = await session.get(Tenant, activation_link.tenant_id)
    if tenant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found",
        )

    new_link = ActivationLink(
        email=activation_link.email,
        user_id=activation_link.user_id,
        tenant_id=activation_link.tenant_id,
        expires_at=now + timedelta(hours=24),
    )
    session.add(new_link)
    await session.flush()
    await session.refresh(new_link)
    await session.commit()
    return new_link, tenant
