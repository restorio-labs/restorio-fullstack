from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.security import hash_password
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.user import User

async def create_user(
    *,
    session: AsyncSession,
    email: str,
    password: str,
    restaurant_name: str,
) -> tuple[User, Tenant]:
    slug = "".join(restaurant_name.split()).lower()
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
    return user, tenant