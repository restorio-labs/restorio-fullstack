from pydantic import EmailStr, Field

from api.v1.dto.common import AccountType, BaseDTO, EntityId


class CreateUserDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    account_type: AccountType = Field(
        default=AccountType.OWNER, description="Account type (owner, waiter, kitchen)"
    )
    is_active: bool = Field(default=True, description="Whether user account is active")


class UpdateUserDTO(BaseDTO):
    email: EmailStr | None = Field(None, description="User email address")
    password: str | None = Field(None, min_length=8, max_length=128, description="User password")
    account_type: AccountType | None = Field(None, description="Account type")
    is_active: bool | None = Field(None, description="Whether user account is active")


class UserLoginDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class CreateUserTenantDTO(BaseDTO):
    user_id: EntityId = Field(..., description="User identifier")
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    role: str = Field(..., min_length=1, max_length=50, description="User role in tenant")
