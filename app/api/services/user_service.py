from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.exceptions import ConflictError
from core.foundation.security import SecurityService
from core.models.enums import AccountType, TenantStatus
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User


class UserService:
    def __init__(self, security: SecurityService) -> None:
        self.security = security

    async def create_user_with_tenant(
        self,
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
            password_hash=self.security.hash_password(password),
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

        tenant_role = TenantRole(
            account_id=user.id,
            tenant_id=tenant.id,
            account_type=AccountType.OWNER,
        )
        session.add(tenant_role)
        await session.flush()

        return user, tenant, tenant_role

    async def create_user_for_tenant(
        self,
        session: AsyncSession,
        email: str,
        password: str,
        tenant_id: UUID,
        account_type: AccountType,
    ) -> tuple[User, TenantRole]:
        existing_user = await session.scalar(select(User).where(User.email == email))
        if existing_user:
            msg = "Email already registered"
            raise ConflictError(msg)

        user = User(
            email=email,
            password_hash=self.security.hash_password(password),
            is_active=False,
            tenant_id=tenant_id,
        )
        session.add(user)
        await session.flush()
        await session.refresh(user)

        tenant_role = TenantRole(
            account_id=user.id,
            tenant_id=tenant_id,
            account_type=account_type,
        )
        session.add(tenant_role)
        await session.flush()

        return user, tenant_role
