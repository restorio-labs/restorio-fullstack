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
    def test_valid_creation(self) -> None:
        dto = CreateRestaurantTableDTO(
            label="Table 1",
            capacity=4,
        )
        assert dto.label == "Table 1"
        assert dto.capacity == 4
        assert dto.is_active is True

    def test_inactive_table(self) -> None:
        dto = CreateRestaurantTableDTO(
            label="Table 2",
            capacity=6,
            is_active=False,
        )
        assert dto.is_active is False

    def test_invalid_capacity_zero(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="Table 1",
                capacity=0,
            )

    def test_invalid_capacity_negative(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="Table 1",
                capacity=-1,
            )

    def test_label_too_long(self) -> None:
        with pytest.raises(ValidationError):
            CreateRestaurantTableDTO(
                label="x" * 51,
                capacity=4,
            )


class TestUpdateRestaurantTableDTO:
    def test_update_label_only(self) -> None:
        dto = UpdateRestaurantTableDTO(label="Updated Table")
        assert dto.label == "Updated Table"
        assert dto.capacity is None
        assert dto.is_active is None

    def test_update_capacity_only(self) -> None:
        dto = UpdateRestaurantTableDTO(capacity=8)
        assert dto.label is None
        assert dto.capacity == 8
        assert dto.is_active is None

    def test_update_is_active_only(self) -> None:
        dto = UpdateRestaurantTableDTO(is_active=False)
        assert dto.label is None
        assert dto.capacity is None
        assert dto.is_active is False

    def test_full_update(self) -> None:
        dto = UpdateRestaurantTableDTO(
            label="VIP Table",
            capacity=10,
            is_active=True,
        )
        assert dto.label == "VIP Table"
        assert dto.capacity == 10
        assert dto.is_active is True


class TestRestaurantTableResponseDTO:
    def test_valid_response(self) -> None:
        table_id = uuid4()
        tenant_id = uuid4()
        now = datetime.now(UTC)

        dto = RestaurantTableResponseDTO(
            id=table_id,
            tenant_id=tenant_id,
            label="Table 5",
            capacity=4,
            is_active=True,
            created_at=now,
        )

        assert dto.id == table_id
        assert dto.tenant_id == tenant_id
        assert dto.label == "Table 5"
        assert dto.capacity == 4
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
            capacity=2,
            is_active=False,
            created_at=now,
        )

        assert dto.is_active is False
