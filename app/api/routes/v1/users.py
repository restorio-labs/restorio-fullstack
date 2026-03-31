from uuid import UUID

from fastapi import APIRouter, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.dto.v1.auth import CreateUserDTO, RegisterCreatedData
from core.exceptions import NotFoundResponse
from core.foundation.dependencies import (
    AuthorizedTenantId,
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.foundation.role_guard import RequireOwner
from core.models.enums import AccountType
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User

router = APIRouter()


async def get_tenant_id_from_request(request: Request, session: AsyncSession) -> UUID:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    tenant_ids_value = user.get("tenant_ids")
    if isinstance(tenant_ids_value, list):
        for tenant_public_id in tenant_ids_value:
            if isinstance(tenant_public_id, str) and tenant_public_id != "":
                result = await session.execute(
                    select(Tenant.id).where(Tenant.public_id == tenant_public_id)
                )
                internal_id = result.scalar_one_or_none()
                if internal_id is not None:
                    return internal_id

    raise UnauthenticatedResponse(message="Unauthorized")


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[RegisterCreatedData],
    summary="Create an inactive staff user",
    description="Create inactive staff user and send activation email",
)
async def create_user(
    _role: RequireOwner,
    data: CreateUserDTO,
    request: Request,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[RegisterCreatedData]:
    tenant_id = await get_tenant_id_from_request(request, session)
    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        raise UnauthenticatedResponse(message="Unauthorized")

    temp_password = user_service.generate_temporary_password()
    created_user, _ = await user_service.create_user_for_tenant(
        session=session,
        email=data.email,
        password=temp_password,
        tenant_id=tenant_id,
        account_type=data.access_level,
        name=data.name,
        surname=data.surname,
        force_password_change=True,
    )

    activation = await auth_service.create_activation_link(
        session=session,
        email=created_user.email,
        user_id=created_user.id,
        tenant_id=tenant.id,
    )
    activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
    await email_service.send_activation_email(
        to_email=created_user.email,
        restaurant_name=tenant.name,
        activation_link=activation_link,
    )

    return CreatedResponse(
        data=RegisterCreatedData(
            user_id=str(created_user.id),
            email=created_user.email,
            tenant_id=tenant.public_id,
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
        ),
        message="User created successfully, activation email sent",
    )


@router.get(
    "/{tenant_public_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[dict[str, str | bool | None]]],
    summary="List tenant staff users",
    description="List waiter and kitchen users for current tenant",
)
async def list_tenant_users(
    tenant_id: AuthorizedTenantId,
    session: PostgresSession,
) -> SuccessResponse[list[dict[str, str | bool | None]]]:
    stmt = (
        select(User.id, User.email, User.name, User.surname, User.is_active, TenantRole.account_type)
        .join(TenantRole, TenantRole.account_id == User.id)
        .where(
            TenantRole.tenant_id == tenant_id,
            TenantRole.account_type.in_([AccountType.WAITER, AccountType.KITCHEN]),
        )
    )
    rows = await session.execute(stmt)

    users = [
        {
            "id": str(user_id),
            "email": email,
            "name": name,
            "surname": surname,
            "is_active": is_active,
            "account_type": account_type.value,
        }
        for user_id, email, name, surname, is_active, account_type in rows.all()
    ]

    if len(users) == 0:
        return SuccessResponse(
            message="No users found for this tenant",
            data=[],
        )

    return SuccessResponse(
        message="Users retrieved successfully",
        data=users,
    )


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
    summary="Delete staff user",
    description="Delete a user from current tenant",
)
async def delete_user(
    _role: RequireOwner,
    user_id: UUID,
    request: Request,
    session: PostgresSession,
) -> SuccessResponse[dict[str, str]]:
    tenant_id = await get_tenant_id_from_request(request, session)
    resource_name = "User"

    user = await session.scalar(select(User).where(User.id == user_id, User.tenant_id == tenant_id))
    if user is None:
        raise NotFoundResponse(resource_name, str(user_id))

    await session.delete(user)
    await session.flush()

    return SuccessResponse(
        message="User deleted successfully",
        data={"deleted_user_id": str(user_id)},
    )
