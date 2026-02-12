from decimal import Decimal

from pydantic import ValidationError
import pytest

from api.v1.dto.menus import CreateMenuItemDTO, CreateModifierDTO, MenuItemDTO, ModifierDTO


class TestCreateModifierDTO:
    def test_valid_creation(self) -> None:
        dto = CreateModifierDTO(
            name="Extra Cheese",
            price=Decimal("2.50"),
        )
        assert dto.name == "Extra Cheese"
        assert dto.price == Decimal("2.50")

    def test_negative_price(self) -> None:
        with pytest.raises(ValidationError):
            CreateModifierDTO(
                name="Invalid",
                price=Decimal("-1.00"),
            )


class TestCreateMenuItemDTO:
    def test_valid_minimal_creation(self) -> None:
        dto = CreateMenuItemDTO(
            name="Burger",
            price=Decimal("15.99"),
        )
        assert dto.name == "Burger"
        assert dto.price == Decimal("15.99")
        assert dto.description is None
        assert dto.category is None
        assert dto.is_available is True

    def test_full_creation(self) -> None:
        dto = CreateMenuItemDTO(
            name="Deluxe Burger",
            price=Decimal("22.99"),
            description="Premium beef burger with special sauce",
            category="Mains",
            is_available=True,
        )
        assert dto.name == "Deluxe Burger"
        assert dto.price == Decimal("22.99")
        assert dto.description == "Premium beef burger with special sauce"
        assert dto.category == "Mains"
        assert dto.is_available is True

    def test_unavailable_item(self) -> None:
        dto = CreateMenuItemDTO(
            name="Seasonal Special",
            price=Decimal("25.00"),
            is_available=False,
        )
        assert dto.is_available is False

    def test_negative_price(self) -> None:
        with pytest.raises(ValidationError):
            CreateMenuItemDTO(
                name="Invalid",
                price=Decimal("-5.00"),
            )


class TestModifierDTO:
    def test_valid_modifier(self) -> None:
        dto = ModifierDTO(
            id="mod-123",
            name="Extra Bacon",
            price=Decimal("3.00"),
        )
        assert dto.id == "mod-123"
        assert dto.name == "Extra Bacon"
        assert dto.price == Decimal("3.00")


class TestMenuItemDTO:
    MODIFIERS_COUNT = 2

    def test_minimal_item(self) -> None:
        dto = MenuItemDTO(
            id="item-456",
            name="Caesar Salad",
            price=Decimal("12.50"),
            is_available=True,
        )
        assert dto.id == "item-456"
        assert dto.name == "Caesar Salad"
        assert dto.price == Decimal("12.50")
        assert dto.description is None
        assert dto.category is None
        assert dto.is_available is True
        assert dto.modifiers == []

    def test_full_item_with_modifiers(self) -> None:
        dto = MenuItemDTO(
            id="item-789",
            name="Custom Pizza",
            price=Decimal("18.99"),
            description="Build your own pizza",
            category="Pizza",
            is_available=True,
            modifiers=[
                ModifierDTO(id="mod-1", name="Extra Cheese", price=Decimal("2.00")),
                ModifierDTO(id="mod-2", name="Pepperoni", price=Decimal("3.00")),
            ],
        )
        assert dto.id == "item-789"
        assert dto.name == "Custom Pizza"
        assert len(dto.modifiers) == self.MODIFIERS_COUNT
        assert dto.modifiers[0].name == "Extra Cheese"
        assert dto.modifiers[1].price == Decimal("3.00")
