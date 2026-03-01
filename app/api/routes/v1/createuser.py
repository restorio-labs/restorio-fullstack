import secrets
import string
from uuid import UUID

from fastapi import APIRouter, Request, status
from sqlalchemy import select

from core.dto.v1.auth import CreateUserDTO, RegisterCreatedData
from core.exceptions import NotFoundResponse
from core.foundation.dependencies import (
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.models.enums import AccountType
from core.models.tenant import Tenant
from core.models.tenant_role import TenantRole
from core.models.user import User

router = APIRouter()


def generate_temporary_password(length: int = 24) -> str:
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    pool = lowercase + uppercase + digits + special

    required = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special),
    ]
    remaining = [secrets.choice(pool) for _ in range(max(0, length - len(required)))]
    candidate = required + remaining
    secrets.SystemRandom().shuffle(candidate)
    return "".join(candidate)


def get_tenant_id_from_request(request: Request) -> UUID:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    tenant_id_value = user.get("tenant_id")
    if not isinstance(tenant_id_value, str) or tenant_id_value == "":
        raise UnauthenticatedResponse(message="Unauthorized")

    return UUID(tenant_id_value)


@router.post(
    "/createuser",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[RegisterCreatedData],
    summary="Create an inactive staff user",
    description="Create inactive staff user and send activation email",
)
async def create_user(
    data: CreateUserDTO,
    request: Request,
    session: PostgresSession,
    auth_service: AuthServiceDep,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[RegisterCreatedData]:
    tenant_id = get_tenant_id_from_request(request)
    tenant = await session.get(Tenant, tenant_id)
    if tenant is None:
        raise UnauthenticatedResponse(message="Unauthorized")

    temp_password = generate_temporary_password()
    created_user, _ = await user_service.create_user_for_tenant(
        session=session,
        email=data.email,
        password=temp_password,
        tenant_id=tenant_id,
        account_type=data.access_level,
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
            tenant_id=str(tenant.id),
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
        ),
        message="User created successfully, activation email sent",
    )


@router.get(
    "/users",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[list[dict[str, str]]],
    summary="List tenant staff users",
    description="List waiter and kitchen users for current tenant",
)
async def list_users(
    request: Request,
    session: PostgresSession,
) -> SuccessResponse[list[dict[str, str]]]:
    tenant_id = get_tenant_id_from_request(request)

    stmt = (
        select(User.id, User.email, TenantRole.account_type)
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
            "account_type": account_type.value,
        }
        for user_id, email, account_type in rows.all()
    ]

    return SuccessResponse(
        message="Users retrieved successfully",
        data=users,
    )


@router.delete(
    "/delete-user/{user_id}",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
    summary="Delete staff user",
    description="Delete a user from current tenant",
)
async def delete_user(
    user_id: UUID,
    request: Request,
    session: PostgresSession,
) -> SuccessResponse[dict[str, str]]:
    tenant_id = get_tenant_id_from_request(request)

    user = await session.scalar(select(User).where(User.id == user_id, User.tenant_id == tenant_id))
    if user is None:
        raise NotFoundResponse("User", str(user_id))

    await session.delete(user)
    await session.flush()

    return SuccessResponse(
        message="User deleted successfully",
        data={"deleted_user_id": str(user_id)},
    )
