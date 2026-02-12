from datetime import datetime

from pydantic import EmailStr, Field

from api.v1.dto.common import AccountType, BaseDTO, EntityId


class UserResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="User identifier")
    email: EmailStr = Field(..., description="User email address")
    account_type: AccountType = Field(..., description="Account type")
    is_active: bool = Field(..., description="Whether user account is active")
    created_at: datetime = Field(..., description="Timestamp when user was created")


class UserTenantResponseDTO(BaseDTO):
    user_id: EntityId = Field(..., description="User identifier")
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    role: str = Field(..., description="User role in tenant")
    created_at: datetime = Field(..., description="Timestamp when relationship was created")
