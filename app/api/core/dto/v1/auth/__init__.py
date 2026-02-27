import re

from pydantic import EmailStr, Field, field_validator

from core.dto.v1.common import BaseDTO
from core.exceptions import ValidationError

_MIN_PASSWORD_LENGTH = 8
_PASSWORD_SPECIAL = re.compile(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>/?]")
_ERROR_MESSAGES = {
    "password_length": "Password must be at least 8 characters",
    "password_lowercase": "Password must contain at least one lowercase letter",
    "password_uppercase": "Password must contain at least one uppercase letter",
    "password_number": "Password must contain at least one number",
    "password_special": "Password must contain at least one special character",
}


class RegisterDTO(BaseDTO):
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    restaurant_name: str = Field(..., min_length=1, max_length=255, description="Restaurant name")

    @field_validator("password")
    @classmethod
    def password_complexity(cls, value: str) -> str:
        if len(value) < _MIN_PASSWORD_LENGTH:
            msg = _ERROR_MESSAGES["password_length"]
            raise ValidationError(message=msg)
        if not re.search(r"[a-z]", value):
            msg = _ERROR_MESSAGES["password_lowercase"]
            raise ValidationError(message=msg)
        if not re.search(r"[A-Z]", value):
            msg = _ERROR_MESSAGES["password_uppercase"]
            raise ValidationError(message=msg)
        if not re.search(r"[0-9]", value):
            msg = _ERROR_MESSAGES["password_number"]
            raise ValidationError(message=msg)
        if not _PASSWORD_SPECIAL.search(value):
            msg = _ERROR_MESSAGES["password_special"]
            raise ValidationError(message=msg)
        return value


class RegisterCreatedData(BaseDTO):
    user_id: str = Field(..., description="Created user ID")
    email: EmailStr = Field(..., description="User email")
    tenant_id: str = Field(..., description="Created tenant ID")
    tenant_name: str = Field(..., description="Tenant name")
    tenant_slug: str = Field(..., description="Tenant slug")


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


class TenantSlugData(BaseDTO):
    tenant_slug: str = Field(..., description="Tenant slug")


class LoginResponseData(BaseDTO):
    at: str = Field(..., description="JWT access token")


class AuthMeSessionData(BaseDTO):
    sub: str = Field(..., description="User id")
    tenant_ids: list[str] = Field(default_factory=list, description="All tenant ids available to the user")
    account_type: str = Field(..., description="Account type for the primary tenant")
