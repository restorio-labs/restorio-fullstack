from uuid import UUID

from fastapi import APIRouter, status

from core.dto.v1.auth import RegisterCreatedData, RegisterDTO, TenantSlugData
from core.dto.v1.users import UserLoginDTO
from core.foundation.dependencies import (
    EmailServiceDep,
    PostgresSession,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse
from core.foundation.infra.config import settings

router = APIRouter()


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: UserLoginDTO) -> dict[str, str]:  # noqa: ARG001
    return {"message": "Login endpoint - to be implemented"}


@router.post(
    "/register",
    response_description="User and tenant created successfully",
    status_code=status.HTTP_201_CREATED,
    response_model=CreatedResponse[RegisterCreatedData],
    summary="Register a new user and tenant",
    description="Register a new user and tenant",
)
async def register(
    data: RegisterDTO,
    session: PostgresSession,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[RegisterCreatedData]:
    user, tenant, _ = await user_service.create_user_with_tenant(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurant_name,
    )
    activation = await email_service.create_activation_link(
        session=session,
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
    )
    activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
    await email_service.send_activation_email(
        to_email=user.email,
        restaurant_name=tenant.name,
        activation_link=activation_link,
    )

    return CreatedResponse(
        data=RegisterCreatedData(
            user_id=str(user.id),
            email=user.email,
            tenant_id=str(tenant.id),
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
        ),
        message="Account created successfully, you should receive email shortly",
    )


@router.post(
    "/activate",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantSlugData],
    summary="Activate a tenant account",
    description="Activate a tenant account",
    response_description="Tenant activated successfully",
)
async def activate(
    activation_id: UUID, session: PostgresSession, email_service: EmailServiceDep
) -> SuccessResponse[TenantSlugData]:
    tenant, already_activated = await email_service.activate_account(
        session=session, activation_id=activation_id
    )
    return SuccessResponse(
        data=TenantSlugData(tenant_slug=tenant.slug),
        message="Account already activated"
        if already_activated
        else "Account activated successfully",
    )


@router.post(
    "/resend-activation",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantSlugData],
    summary="Resend activation link",
    description="Resend activation link",
    response_description="Activation email sent",
)
async def resend_activation(
    activation_id: UUID,
    session: PostgresSession,
    email_service: EmailServiceDep,
) -> SuccessResponse[TenantSlugData]:
    new_link, tenant = await email_service.resend_activation_link(
        session=session, activation_id=activation_id
    )
    activation_url = f"{settings.FRONTEND_URL}/activate?activation_id={new_link.id}"
    await email_service.send_activation_email(
        to_email=new_link.email,
        restaurant_name=tenant.name,
        activation_link=activation_url,
    )
    return SuccessResponse(
        data=TenantSlugData(tenant_slug=tenant.slug),
        message="Activation email sent",
    )


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}
