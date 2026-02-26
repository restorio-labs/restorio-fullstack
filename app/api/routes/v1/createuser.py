import secrets
import string
from uuid import UUID

from fastapi import APIRouter, Request, status

from core.dto.v1.auth import CreateUserDTO, RegisterCreatedData
from core.foundation.dependencies import (
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.models.tenant import Tenant

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
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    tenant_id_value = user.get("tenant_id")
    if not isinstance(tenant_id_value, str) or tenant_id_value == "":
        raise UnauthenticatedResponse(message="Unauthorized")

    tenant_id = UUID(tenant_id_value)
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
