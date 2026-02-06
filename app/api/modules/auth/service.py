from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictError
from core.foundation.security import hash_password
from core.models.enums import AccountType, TenantStatus
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
