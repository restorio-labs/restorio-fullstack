from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException, Request, status

from core.dto.v1 import (
    MenuCategoryDTO,
    MenuItemDTO,
    TenantMenuResponseDTO,
    UpsertTenantMenuDTO,
)
from core.foundation.dependencies import MongoDB
from core.foundation.http.responses import (
    SuccessResponse,
    UnauthenticatedResponse,
    UnauthorizedResponse,
    UpdatedResponse,
)

router = APIRouter()

_CATEGORY_META_KEY = "__category"
_MENU_COLLECTION = "menus"


def _assert_tenant_access(request: Request, tenant_id: UUID) -> None:
    user = getattr(request.state, "user", None)
    if not isinstance(user, dict):
        raise UnauthenticatedResponse(message="Unauthorized")

    allowed_tenant_ids: set[str] = set()

    tenant_id_value = user.get("tenant_id")
    if isinstance(tenant_id_value, str) and tenant_id_value != "":
        allowed_tenant_ids.add(tenant_id_value)

    tenant_ids_value = user.get("tenant_ids")
    if isinstance(tenant_ids_value, list):
        for tenant_id_item in tenant_ids_value:
            if isinstance(tenant_id_item, str) and tenant_id_item != "":
                allowed_tenant_ids.add(tenant_id_item)

    if str(tenant_id) not in allowed_tenant_ids:
        raise UnauthorizedResponse(message="Access to this tenant is forbidden")


def _validate_payload(data: UpsertTenantMenuDTO) -> None:
    seen_orders: set[int] = set()
    for category in data.categories:
        if category.order in seen_orders:
            msg = f"Duplicate category order value: {category.order}"
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
        seen_orders.add(category.order)

        seen_item_names: set[str] = set()
        for item in category.items:
            normalized_name = item.name.strip().lower()
            if normalized_name in seen_item_names:
                msg = f"Duplicate item name '{item.name}' in category '{category.name}'"
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
            seen_item_names.add(normalized_name)


def _build_raw_menu(data: UpsertTenantMenuDTO) -> dict[str, dict]:
    raw_menu: dict[str, dict] = {}
    for category in sorted(data.categories, key=lambda cat: cat.order):
        bucket: dict[str, dict | str | int] = {
            _CATEGORY_META_KEY: {
                "name": category.name,
                "order": category.order,
            }
        }
        for item in category.items:
            bucket[item.name] = {
                "price": item.price,
                "promoted": item.promoted,
                "desc": item.desc,
                "tags": item.tags,
            }
        raw_menu[str(category.order)] = bucket
    return raw_menu


def _normalize_categories(raw_menu: dict[str, dict]) -> list[MenuCategoryDTO]:
    categories: list[MenuCategoryDTO] = []

    for order_key in sorted(
        raw_menu.keys(), key=lambda value: int(value) if value.isdigit() else value
    ):
        category_data = raw_menu.get(order_key)
        if not isinstance(category_data, dict):
            continue

        meta = category_data.get(_CATEGORY_META_KEY, {})
        category_name = f"Category {order_key}"
        category_order = int(order_key) if order_key.isdigit() else 0
        if isinstance(meta, dict):
            meta_name = meta.get("name")
            meta_order = meta.get("order")
            if isinstance(meta_name, str) and meta_name.strip() != "":
                category_name = meta_name
            if isinstance(meta_order, int):
                category_order = meta_order

        items: list[MenuItemDTO] = []
        for item_name, item_payload in category_data.items():
            if item_name == _CATEGORY_META_KEY or not isinstance(item_payload, dict):
                continue

            raw_price = item_payload.get("price", 0)
            raw_promoted = item_payload.get("promoted", 0)
            raw_desc = item_payload.get("desc", "")
            raw_tags = item_payload.get("tags", [])

            price = float(raw_price) if isinstance(raw_price, int | float) else 0.0
            promoted = 1 if raw_promoted == 1 else 0
            desc = raw_desc if isinstance(raw_desc, str) else ""
            tags = (
                [tag for tag in raw_tags if isinstance(tag, str)]
                if isinstance(raw_tags, list)
                else []
            )

            items.append(
                MenuItemDTO(
                    name=item_name,
                    price=price,
                    promoted=promoted,
                    desc=desc,
                    tags=tags,
                )
            )

        categories.append(
            MenuCategoryDTO(
                name=category_name,
                order=category_order,
                items=items,
            )
        )

    return sorted(categories, key=lambda category: category.order)


@router.get(
    "/{tenant_id}/menu",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMenuResponseDTO | None],
    summary="Get tenant menu",
    description="Get menu definition for a tenant from MongoDB",
)
async def get_tenant_menu(
    tenant_id: UUID,
    request: Request,
    db: MongoDB,
) -> SuccessResponse[TenantMenuResponseDTO | None]:
    _assert_tenant_access(request, tenant_id)

    document = await db[_MENU_COLLECTION].find_one({"tenantID": str(tenant_id)})
    if document is None:
        return SuccessResponse(
            message="Tenant menu not yet created",
            data=None,
        )

    raw_menu = document.get("menu", {})
    normalized_menu = raw_menu if isinstance(raw_menu, dict) else {}
    categories = _normalize_categories(normalized_menu)

    return SuccessResponse(
        message="Tenant menu retrieved successfully",
        data=TenantMenuResponseDTO(
            tenantId=tenant_id,
            tenantID=str(tenant_id),
            menu=normalized_menu,
            categories=categories,
            updatedAt=document.get("updatedAt"),
        ),
    )


@router.put(
    "/{tenant_id}/menu",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantMenuResponseDTO],
    summary="Create or update tenant menu",
    description="Save menu definition for a tenant in MongoDB",
)
async def upsert_tenant_menu(
    tenant_id: UUID,
    payload: UpsertTenantMenuDTO,
    request: Request,
    db: MongoDB,
) -> UpdatedResponse[TenantMenuResponseDTO]:
    _assert_tenant_access(request, tenant_id)
    _validate_payload(payload)

    raw_menu = _build_raw_menu(payload)
    now = datetime.now(UTC)

    await db[_MENU_COLLECTION].update_one(
        {"tenantID": str(tenant_id)},
        {"$set": {"tenantID": str(tenant_id), "menu": raw_menu, "updatedAt": now}},
        upsert=True,
    )

    return UpdatedResponse(
        message="Tenant menu saved successfully",
        data=TenantMenuResponseDTO(
            tenantId=tenant_id,
            tenantID=str(tenant_id),
            menu=raw_menu,
            categories=_normalize_categories(raw_menu),
            updatedAt=now,
        ),
    )
