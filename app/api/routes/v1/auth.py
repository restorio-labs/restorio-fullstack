from uuid import UUID

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from api.v1.dto.auth import LoginResponseData, RegisterCreatedData, RegisterDTO, TenantSlugData
from api.v1.dto.users import UserLoginDTO
from core.foundation.dependencies import PostgresSession
from core.foundation.http.responses import created_response, success_response
from core.foundation.infra.config import settings
from modules.auth.service import (
    activate_account,
    create_activation_link,
    create_user_with_tenant,
    login_user,
    resend_activation_link,
)
from modules.email.service import send_activation_email

router = APIRouter()


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: UserLoginDTO, session: PostgresSession) -> JSONResponse:
    access_token, expires_in = await login_user(
        session=session,
        email=credentials.email,
        password=credentials.password,
    )
    return success_response(
        data=LoginResponseData(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
        ),
        message="Login successful",
    )


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterDTO, session: PostgresSession) -> JSONResponse:
    user, tenant, tenant_role = await create_user_with_tenant(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurant_name,
    )
    activation = await create_activation_link(
        session=session,
        email=user.email,
        user_id=user.id,
        tenant_id=tenant.id,
    )
    activation_link = f"{settings.FRONTEND_URL}/activate?activation_id={activation.id}"
    await send_activation_email(
        to_email=user.email,
        restaurant_name=tenant.name,
        activation_link=activation_link,
    )
    return created_response(
        data=RegisterCreatedData(
            user_id=str(user.id),
            email=user.email,
            account_type=tenant_role.account_type.value,
            tenant_id=str(tenant.id),
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
        ),
        message="Account created successfully, you should receive email shortly",
    )


@router.post("/activate", status_code=status.HTTP_200_OK)
async def activate(activation_id: UUID, session: PostgresSession) -> JSONResponse:
    tenant, already_activated = await activate_account(session=session, activation_id=activation_id)
    return success_response(
        data=TenantSlugData(tenant_slug=tenant.slug),
        message=(
            "Account already activated" if already_activated else "Account activated successfully"
        ),
    )


@router.post("/resend-activation", status_code=status.HTTP_200_OK)
async def resend_activation(activation_id: UUID, session: PostgresSession) -> JSONResponse:
    new_link, tenant = await resend_activation_link(session=session, activation_id=activation_id)
    activation_url = f"{settings.FRONTEND_URL}/activate?activation_id={new_link.id}"
    await send_activation_email(
        to_email=new_link.email,
        restaurant_name=tenant.name,
        activation_link=activation_url,
    )
    return success_response(
        data=TenantSlugData(tenant_slug=tenant.slug),
        message="Activation email sent",
    )


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}
