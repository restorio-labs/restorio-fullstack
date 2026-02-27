from datetime import timedelta
from uuid import UUID

from fastapi import APIRouter, Request, Response, status

from core.dto.v1.auth import (
    AuthMeSessionData,
    LoginResponseData,
    RegisterCreatedData,
    RegisterDTO,
    TenantSlugData,
)
from core.dto.v1.users import UserLoginDTO
from core.exceptions.http import UnauthorizedError
from core.foundation.auth_cookies import (
    clear_auth_cookies,
    get_refresh_token_from_request,
    set_auth_cookies,
)
from core.foundation.dependencies import (
    AuthServiceDep,
    EmailServiceDep,
    PostgresSession,
    SecurityServiceDep,
    UserServiceDep,
)
from core.foundation.http.responses import CreatedResponse, SuccessResponse, UnauthenticatedResponse
from core.foundation.infra.config import settings
from core.models.activation_link import ActivationLink
from core.models.enums import AccountType
from core.models.user import User

router = APIRouter()


@router.post(
    "/login",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[LoginResponseData],
    summary="Login a user",
    description="Login a user",
    response_description="Login successful",
)
async def login(
    credentials: UserLoginDTO,
    request: Request,
    response: Response,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[LoginResponseData]:
    access_token = await auth_service.login(
        session=session,
        email=credentials.email,
        password=credentials.password,
    )

    payload = auth_service.security.decode_access_token(access_token)
    token_data = {
        "sub": payload.get("sub"),
        "email": payload.get("email"),
        "tenant_ids": payload.get("tenant_ids"),
        "account_type": payload.get("account_type"),
    }
    refresh_token = auth_service.security.create_access_token(
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
        data=LoginResponseData(
            at=access_token,
        ),
        message="Login successful",
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
    auth_service: AuthServiceDep,
    user_service: UserServiceDep,
    email_service: EmailServiceDep,
) -> CreatedResponse[RegisterCreatedData]:
    user, tenant, _ = await user_service.create_user_with_tenant(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurant_name,
    )
    activation = await auth_service.create_activation_link(
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
    activation_id: UUID,
    request: Request,
    response: Response,
    session: PostgresSession,
    auth_service: AuthServiceDep,
) -> SuccessResponse[TenantSlugData]:
    tenant, already_activated = await auth_service.activate_account(
        session=session, activation_id=activation_id
    )

    activation_link = await session.get(ActivationLink, activation_id)
    if activation_link is not None:
        user = await session.get(User, activation_link.user_id)
        if user is not None:
            token_data = {
                "sub": str(user.id),
                "email": user.email,
                "tenant_ids": [str(tenant.id)],
                "account_type": AccountType.OWNER.value,
            }
            access_token = auth_service.security.create_access_token(token_data)
            refresh_token = auth_service.security.create_access_token(
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
    auth_service: AuthServiceDep,
    email_service: EmailServiceDep,
) -> SuccessResponse[TenantSlugData]:
    new_link, tenant = await auth_service.resend_activation_link(
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

    tenant_ids_claim = payload.get("tenant_ids")
    tenant_ids: list[str] = []
    if isinstance(tenant_ids_claim, list):
        tenant_ids = [tenant_id_item for tenant_id_item in tenant_ids_claim if isinstance(tenant_id_item, str)]
    account_type = payload.get("account_type")
    email = payload.get("email")
    token_data = {
        "sub": user_id,
        "tenant_ids": tenant_ids,
        "account_type": account_type if isinstance(account_type, str) else None,
        "email": email if isinstance(email, str) else None,
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
    response_model=SuccessResponse[AuthMeSessionData],
)
async def me(request: Request) -> SuccessResponse[AuthMeSessionData]:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    subject = user.get("sub")
    tenant_ids_claim = user.get("tenant_ids")
    tenant_ids: list[str] = []
    if isinstance(tenant_ids_claim, list):
        tenant_ids = [tenant_id_item for tenant_id_item in tenant_ids_claim if isinstance(tenant_id_item, str)]
    account_type = user.get("account_type")
    if not isinstance(subject, str):
        raise UnauthenticatedResponse(message="Unauthorized")

    return SuccessResponse(
        data={
            "sub": subject,
            "tenant_ids": tenant_ids,
            "account_type": account_type if isinstance(account_type, str) else "",
        },
        message="Authenticated",
    )
