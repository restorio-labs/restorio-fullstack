from datetime import UTC, datetime
from uuid import uuid4

from pydantic import ValidationError
import pytest

from api.v1.dto.restaurants import (
    CreateRestaurantTableDTO,
    RestaurantTableResponseDTO,
    UpdateRestaurantTableDTO,
)


class TestCreateRestaurantTableDTO:
    CAPACITY_STANDARD = 4

    def test_valid_creation(self) -> None:
        dto = CreateRestaurantTableDTO(
            label="Table 1",
            capacity=self.CAPACITY_STANDARD,
        )
        assert dto.label == "Table 1"
        assert dto.capacity == self.CAPACITY_STANDARD
        assert dto.is_active is True

    CAPACITY_MEDIUM = 6

    def test_inactive_table(self) -> None:
        dto = CreateRestaurantTableDTO(
            label="Table 2",
            capacity=self.CAPACITY_MEDIUM,
            is_active=False,
        )
        assert dto.is_active is False

    CAPACITY_ZERO = 0
    CAPACITY_NEGATIVE = -1
    MAX_LABEL_LENGTH = 51

    def test_invalid_capacity_zero(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="Table 1",
                capacity=self.CAPACITY_ZERO,
            )

    def test_invalid_capacity_negative(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="Table 1",
                capacity=self.CAPACITY_NEGATIVE,
            )

    def test_label_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="x" * self.MAX_LABEL_LENGTH,
                capacity=self.CAPACITY_STANDARD,
            )


class TestUpdateRestaurantTableDTO:
    CAPACITY_LARGE = 8
    CAPACITY_XLARGE = 10

    def test_update_label_only(self) -> None:
        dto = UpdateRestaurantTableDTO(label="Updated Table")
        assert dto.label == "Updated Table"
        assert dto.capacity is None
        assert dto.is_active is None

    def test_update_capacity_only(self) -> None:
        dto = UpdateRestaurantTableDTO(capacity=self.CAPACITY_LARGE)
        assert dto.label is None
        assert dto.capacity == self.CAPACITY_LARGE
        assert dto.is_active is None

    def test_update_is_active_only(self) -> None:
        dto = UpdateRestaurantTableDTO(is_active=False)
        assert dto.label is None
        assert dto.capacity is None
        assert dto.is_active is False

    def test_full_update(self) -> None:
        dto = UpdateRestaurantTableDTO(
            label="VIP Table",
            capacity=self.CAPACITY_XLARGE,
            is_active=True,
        )
        assert dto.label == "VIP Table"
        assert dto.capacity == self.CAPACITY_XLARGE
        assert dto.is_active is True


class TestRestaurantTableResponseDTO:
    CAPACITY_STANDARD = 4
    CAPACITY_SMALL = 2

    def test_valid_response(self) -> None:
        table_id = uuid4()
        tenant_id = uuid4()
        now = datetime.now(UTC)

        dto = RestaurantTableResponseDTO(
            id=table_id,
            tenant_id=tenant_id,
            label="Table 5",
            capacity=self.CAPACITY_STANDARD,
            is_active=True,
            created_at=now,
        )

        assert dto.id == table_id
        assert dto.tenant_id == tenant_id
        assert dto.label == "Table 5"
        assert dto.capacity == self.CAPACITY_STANDARD
        assert dto.is_active is True
        assert dto.created_at == now

    def test_inactive_table_response(self) -> None:
        table_id = uuid4()
        tenant_id = uuid4()
        now = datetime.now(UTC)

        dto = RestaurantTableResponseDTO(
            id=table_id,
            tenant_id=tenant_id,
            label="Table 99",
            capacity=self.CAPACITY_SMALL,
            is_active=False,
            created_at=now,
        )

        assert dto.is_active is False
