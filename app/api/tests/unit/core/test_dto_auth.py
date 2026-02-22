from pydantic import ValidationError as PydanticValidationError
import pytest

from core.dto.v1.auth import (
    LoginResponseData,
    RegisterCreatedData,
    RegisterDTO,
    RegisterResponseDTO,
    TenantSlugData,
)
from core.exceptions import ValidationError


class TestRegisterDTO:
    def test_valid_registration(self) -> None:
        dto = RegisterDTO(
            email="user@example.com",
            password="SecurePass1!",
            restaurant_name="My Restaurant",
        )
        assert dto.email == "user@example.com"
        assert dto.password == "SecurePass1!"
        assert dto.restaurant_name == "My Restaurant"

    def test_password_too_short_raises_validation_error(self) -> None:
        with pytest.raises(PydanticValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="Short1!",
                restaurant_name="Restaurant",
            )
        assert "8" in str(exc_info.value)

    def test_password_missing_lowercase_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SECUREPASS1!",
                restaurant_name="Restaurant",
            )
        assert "lowercase" in exc_info.value.detail

    def test_password_missing_uppercase_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="securepass1!",
                restaurant_name="Restaurant",
            )
        assert "uppercase" in exc_info.value.detail

    def test_password_missing_number_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SecurePass!",
                restaurant_name="Restaurant",
            )
        assert "number" in exc_info.value.detail

    def test_password_missing_special_char_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            RegisterDTO(
                email="user@example.com",
                password="SecurePass123",
                restaurant_name="Restaurant",
            )
        assert "special" in exc_info.value.detail


class TestRegisterCreatedData:
    def test_valid_creation(self) -> None:
        dto = RegisterCreatedData(
            user_id="user-123",
            email="user@example.com",
            tenant_id="tenant-456",
            tenant_name="My Venue",
            tenant_slug="my-venue",
        )
        assert dto.user_id == "user-123"
        assert dto.email == "user@example.com"
        assert dto.tenant_id == "tenant-456"
        assert dto.tenant_name == "My Venue"
        assert dto.tenant_slug == "my-venue"


class TestRegisterResponseDTO:
    def test_valid_with_default_message(self) -> None:
        dto = RegisterResponseDTO(
            user_id="user-123",
            email="user@example.com",
            account_type="owner",
            tenant_id="tenant-456",
            tenant_name="My Venue",
            tenant_slug="my-venue",
        )
        assert dto.message == "Account created successfully, you should receive email shortly"

    def test_valid_with_custom_message(self) -> None:
        dto = RegisterResponseDTO(
            user_id="user-123",
            email="user@example.com",
            account_type="owner",
            tenant_id="tenant-456",
            tenant_name="My Venue",
            tenant_slug="my-venue",
            message="Custom message",
        )
        assert dto.message == "Custom message"


class TestTenantSlugData:
    def test_valid_slug(self) -> None:
        dto = TenantSlugData(tenant_slug="my-restaurant")
        assert dto.tenant_slug == "my-restaurant"


class TestLoginResponseData:
    def test_valid_response(self) -> None:
        dto = LoginResponseData(at="jwt-access-token")
        assert dto.at == "jwt-access-token"
