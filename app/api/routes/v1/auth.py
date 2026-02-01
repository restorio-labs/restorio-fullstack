from fastapi import APIRouter, status

from api.v1.dto.auth import RegisterDTO, RegisterResponseDTO
from api.v1.dto.users import UserLoginDTO
from core.foundation.dependencies import PostgresSession
from modules.auth.service import create_user_with_tenant

router = APIRouter()


@router.post("/login", status_code=status.HTTP_200_OK)
async def login(credentials: UserLoginDTO) -> dict[str, str]:
    return {"message": "Login endpoint - to be implemented"}


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(data: RegisterDTO, session: PostgresSession) -> RegisterResponseDTO:
    user, tenant = await create_user_with_tenant(
        session=session,
        email=data.email,
        password=data.password,
        restaurant_name=data.restaurant_name,
    )
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
