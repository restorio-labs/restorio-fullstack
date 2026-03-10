from pydantic import ValidationError
import pytest

from core.dto.v1.menus import (
    MenuCategoryDTO,
    MenuCategoryInputDTO,
    MenuItemDTO,
    MenuItemInputDTO,
    TenantMenuResponseDTO,
    UpsertTenantMenuDTO,
)


class TestMenuItemInputDTO:
    def test_valid_creation(self) -> None:
        dto = MenuItemInputDTO(
            name="Burger",
            price=29.99,
            promoted=1,
            desc="Classic burger",
            tags=["beef", "spicy"],
        )
        assert dto.name == "Burger"
        assert dto.price == 29.99
        assert dto.promoted == 1

    def test_promoted_flag_validation(self) -> None:
        with pytest.raises(ValidationError):
            MenuItemInputDTO(
                name="Burger",
                price=10,
                promoted=2,
            )


class TestMenuCategoryInputDTO:
    def test_category_requires_non_negative_order(self) -> None:
        with pytest.raises(ValidationError):
            MenuCategoryInputDTO(
                name="Mains",
                order=-1,
            )


class TestUpsertTenantMenuDTO:
    def test_nested_payload(self) -> None:
        dto = UpsertTenantMenuDTO(
            categories=[
                MenuCategoryInputDTO(
                    name="Mains",
                    order=0,
                    items=[
                        MenuItemInputDTO(
                            name="Burger",
                            price=21.5,
                            promoted=0,
                            desc="Chef special",
                            tags=["beef"],
                        )
                    ],
                )
            ]
        )
        assert len(dto.categories) == 1
        assert dto.categories[0].items[0].name == "Burger"


class TestMenuItemDTO:
    def test_response_shape(self) -> None:
        dto = MenuItemDTO(
            name="Soup",
            price=12.5,
            promoted=0,
            desc="Tomato soup",
            tags=["vegan"],
        )
        assert dto.name == "Soup"
        assert dto.tags == ["vegan"]


class TestTenantMenuResponseDTO:
    def test_includes_aliases(self) -> None:
        tenant_id = "11111111-1111-1111-1111-111111111111"
        payload = TenantMenuResponseDTO(
            tenantId=tenant_id,
            tenantID=tenant_id,
            menu={"0": {"__category": {"name": "Mains", "order": 0}}},
            categories=[MenuCategoryDTO(name="Mains", order=0, items=[])],
        )
        dumped = payload.model_dump(by_alias=True)
        assert str(dumped["tenantId"]) == tenant_id
        assert dumped["tenantID"] == tenant_id
