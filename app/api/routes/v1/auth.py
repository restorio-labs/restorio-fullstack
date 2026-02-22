from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Request, Response, status
from sqlalchemy import select

from core.dto.v1.auth import RegisterCreatedData, RegisterDTO, TenantSlugData
from core.dto.v1.users import UserLoginDTO
from core.exceptions.http import UnauthorizedError
from core.foundation.auth_cookies import (
    clear_auth_cookies,
    get_refresh_token_from_request,
    set_auth_cookies,
)
from core.foundation.dependencies import (
    EmailServiceDep,
    PostgresSession,
    SecurityServiceDep,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse
from core.foundation.infra.config import settings
from core.models.user import User

router = APIRouter()


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def login(
    credentials: UserLoginDTO,
    request: Request,
    response: Response,
    session: PostgresSession,
    security_service: SecurityServiceDep,
) -> SuccessResponse[dict[str, str]]:
    user = await session.scalar(select(User).where(User.email == credentials.email))

    if user is None or not security_service.verify_password(
        credentials.password, user.password_hash
    ):
        raise UnauthorizedError(message="Invalid email or password")

    if not user.is_active:
        raise UnauthorizedError(message="Account is inactive")

    token_data = {
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id) if user.tenant_id is not None else "",
    }
    access_token = security_service.create_access_token(token_data)
    refresh_token = security_service.create_access_token(
        {**token_data, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=refresh_token,
    )

    return SuccessResponse(
        message="Login successful",
        data={"authenticated": "true"},
    )


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


@router.post(
    "/refresh",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def refresh_token(
    request: Request,
    response: Response,
    security_service: SecurityServiceDep,
) -> SuccessResponse[dict[str, str]]:
    refresh_token_value = get_refresh_token_from_request(request)
    if refresh_token_value is None:
        raise UnauthorizedError(message="Unauthorized")

    payload = security_service.decode_access_token(refresh_token_value)
    if payload.get("type") != "refresh":
        raise UnauthorizedError(message="Unauthorized")

    user_id = payload.get("sub")
    if not isinstance(user_id, str) or not user_id:
        raise UnauthorizedError(message="Unauthorized")

    tenant_id = payload.get("tenant_id")
    token_data = {
        "sub": user_id,
        "tenant_id": tenant_id if isinstance(tenant_id, str) else "",
    }
    access_token = security_service.create_access_token(token_data)
    next_refresh_token = security_service.create_access_token(
        {**token_data, "type": "refresh"},
        expires_delta=timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )

    set_auth_cookies(
        response=response,
        request=request,
        access_token=access_token,
        refresh_token=next_refresh_token,
    )

    return SuccessResponse(
        message="Token refreshed",
        data={"refreshed": "true"},
    )


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def logout(request: Request, response: Response) -> SuccessResponse[dict[str, str]]:
    clear_auth_cookies(response=response, request=request)
    return SuccessResponse(
        message="Logout successful",
        data={"logged_out": "true"},
    )


@router.get(
    "/me",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[dict[str, str]],
)
async def me(request: Request) -> SuccessResponse[dict[str, str]]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthorizedError(message="Unauthorized")

    subject = user.get("sub")
    tenant_id = user.get("tenant_id")
    if not isinstance(subject, str):
        raise UnauthorizedError(message="Unauthorized")

    return SuccessResponse(
        data={
            "sub": subject,
            "tenant_id": tenant_id if isinstance(tenant_id, str) else "",
        },
        message="Authenticated",
    )
