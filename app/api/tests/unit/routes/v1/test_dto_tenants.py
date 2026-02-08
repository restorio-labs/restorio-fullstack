from datetime import UTC, datetime
from uuid import uuid4

from pydantic import ValidationError
import pytest

from api.v1.dto.common import TenantStatus
from api.v1.dto.tenants import CreateTenantDTO, TenantResponseDTO, UpdateTenantDTO


class TestCreateTenantDTO:
    def test_valid_creation(self) -> None:
        dto = CreateTenantDTO(
            name="Test Restaurant",
            slug="test-restaurant",
        )
        assert dto.name == "Test Restaurant"
        assert dto.slug == "test-restaurant"
        assert dto.status == TenantStatus.ACTIVE

    def test_custom_status(self) -> None:
        dto = CreateTenantDTO(
            name="Test Restaurant",
            slug="test-restaurant",
            status=TenantStatus.INACTIVE,
        )
        assert dto.status == TenantStatus.INACTIVE

    def test_slug_validation_invalid_characters(self) -> None:
        with pytest.raises(ValidationError) as exc_info:
            CreateTenantDTO(
                name="Test Restaurant",
                slug="Test Restaurant",
            )
        errors = exc_info.value.errors()
        assert any("slug" in str(err) for err in errors)

    def test_name_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateTenantDTO(
                name="x" * 256,
                slug="test",
            )

    def test_slug_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateTenantDTO(
                name="Test",
                slug="x" * 101,
            )

    def test_empty_name(self) -> None:
        with pytest.raises(ValidationError):
            CreateTenantDTO(
                name="",
                slug="test",
            )


class TestUpdateTenantDTO:
    def test_partial_update_name_only(self) -> None:
        dto = UpdateTenantDTO(name="Updated Name")
        assert dto.name == "Updated Name"
        assert dto.slug is None
        assert dto.status is None

    def test_partial_update_slug_only(self) -> None:
        dto = UpdateTenantDTO(slug="updated-slug")
        assert dto.name is None
        assert dto.slug == "updated-slug"
        assert dto.status is None

    def test_partial_update_status_only(self) -> None:
        dto = UpdateTenantDTO(status=TenantStatus.SUSPENDED)
        assert dto.name is None
        assert dto.slug is None
        assert dto.status == TenantStatus.SUSPENDED

    def test_full_update(self) -> None:
        dto = UpdateTenantDTO(
            name="Updated Name",
            slug="updated-slug",
            status=TenantStatus.SUSPENDED,
        )
        assert dto.name == "Updated Name"
        assert dto.slug == "updated-slug"
        assert dto.status == TenantStatus.SUSPENDED

    def test_empty_update(self) -> None:
        dto = UpdateTenantDTO()
        assert dto.name is None
        assert dto.slug is None
        assert dto.status is None


class TestTenantResponseDTO:
    def test_valid_response(self) -> None:
        tenant_id = uuid4()
        now = datetime.now(UTC)
        dto = TenantResponseDTO(
            id=tenant_id,
            name="Test Restaurant",
            slug="test-restaurant",
            status=TenantStatus.ACTIVE,
            created_at=now,
        )
        assert dto.id == tenant_id
        assert dto.name == "Test Restaurant"
        assert dto.slug == "test-restaurant"
        assert dto.status == TenantStatus.ACTIVE
        assert dto.created_at == now

    def test_missing_required_fields(self) -> None:
        with pytest.raises(ValidationError):
            TenantResponseDTO(
                name="Test",
                slug="test",
            )
