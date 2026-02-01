from pydantic import EmailStr, Field

from api.v1.dto.common import BaseDTO


class RegisterDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    restaurant_name: str = Field(..., min_length=1, max_length=255, description="Restaurant name")


class RegisterResponseDTO(BaseDTO):
    user_id: str = Field(..., description="Created user ID")
    email: EmailStr = Field(..., description="User email")
    account_type: str = Field(..., description="Account type")
    tenant_id: str = Field(..., description="Created tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    tenant_slug: str = Field(..., description="Tenant slug")
    message: str = Field(
        default="Account created successfully, you should receive email shortly",
        description="Success message",
    )
