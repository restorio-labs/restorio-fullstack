<<<<<<< HEAD
from uuid import UUID

from fastapi import APIRouter
from pydantic import BaseModel, Field
=======
from fastapi import APIRouter, status
>>>>>>> main

from api.v1.dto.auth import RegisterDTO, RegisterResponseDTO
from api.v1.dto.users import UserLoginDTO
from core.foundation.dependencies import PostgresSession
<<<<<<< HEAD
from core.foundation.infra.config import settings
from modules.auth.database import (
    activate_account,
    create_activation_link,
    create_user,
    resend_activation_link,
)
from modules.email.service import send_activation_email
=======
from modules.auth.service import create_user_with_tenant
>>>>>>> main

router = APIRouter()


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: UserLoginDTO) -> dict[str, str]:  # noqa: ARG001
    return {"message": "Login endpoint - to be implemented"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterDTO, session: PostgresSession) -> RegisterResponseDTO:
    user, tenant = await create_user_with_tenant(
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
    return {
        "message": "Account created succesfully, you should receive email shortly",
        "id": str(user.id),
        "email": user.email,
        "account_type": user.account_type,
        "tenant": {
            "id": str(tenant.id),
            "name": tenant.name,
            "slug": tenant.slug,
        },
    }


@router.post("/activate", status_code=200)
async def activate(activation_id: UUID, session: PostgresSession):
    tenant, already_activated = await activate_account(
        session=session, activation_id=activation_id
    )
    return {
        "message": (
            "Account already activated"
            if already_activated
            else "Account activated successfully"
        ),
        "tenant_slug": tenant.slug,
    }


@router.post("/resend-activation", status_code=200)
async def resend_activation(activation_id: UUID, session: PostgresSession):
    new_link, tenant = await resend_activation_link(
        session=session, activation_id=activation_id
    )
    activation_url = f"{settings.FRONTEND_URL}/activate?activation_id={new_link.id}"
    await send_activation_email(
        to_email=new_link.email,
        restaurant_name=tenant.name,
        activation_link=activation_url,
    )
    return {"message": "Activation email sent", "tenant_slug": tenant.slug}


@router.post("/refresh")
    return RegisterResponseDTO(
        user_id=str(user.id),
        email=user.email,
        account_type=user.account_type.value,
        tenant_id=str(tenant.id),
        tenant_name=tenant.name,
        tenant_slug=tenant.slug,
    )


@router.post("/refresh", status_code=status.HTTP_200_OK)
async def refresh_token() -> dict[str, str]:
    return {"message": "Refresh token endpoint - to be implemented"}