from datetime import UTC, datetime

from fastapi import APIRouter, HTTPException, status

from core.dto.v1 import (
    TenantMenuResponseDTO,
    UpsertTenantMenuDTO,
)
from core.foundation.dependencies import AuthorizedTenantId, MongoDB
from core.foundation.http.responses import (
    SuccessResponse,
    UpdatedResponse,
)
from services.mongo_menu_service import (
    CATEGORY_META_KEY,
    MENU_COLLECTION,
    normalize_mongo_menu_categories,
)

router = APIRouter()


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
            CATEGORY_META_KEY: {
                "name": category.name,
                "order": category.order,
            }
        }
        for item in category.items:
            bucket[item.name] = {
                "price": item.price,
                "promoted": item.promoted,
                "active": item.active,
                "desc": item.desc,
                "tags": item.tags,
            }
        raw_menu[str(category.order)] = bucket
    return raw_menu


@router.get(
    "/{tenant_public_id}/menu",
    status_code=status.HTTP_200_OK,
    response_model=SuccessResponse[TenantMenuResponseDTO],
    summary="Get tenant menu",
    description="Get menu definition for a tenant from MongoDB",
)
async def get_tenant_menu(
    tenant_public_id: str,
    _tenant_id: AuthorizedTenantId,
    db: MongoDB,
) -> SuccessResponse[TenantMenuResponseDTO]:
    document = await db[MENU_COLLECTION].find_one({"tenantPublicId": tenant_public_id})
    if document is None:
        return SuccessResponse(
            message="Tenant menu not yet created",
            data=TenantMenuResponseDTO(
                menu={},
                categories=[],
                updatedAt=None,
            ),
        )

    raw_menu = document.get("menu", {})
    normalized_menu = raw_menu if isinstance(raw_menu, dict) else {}
    categories = normalize_mongo_menu_categories(normalized_menu)

    return SuccessResponse(
        message="Tenant menu retrieved successfully",
        data=TenantMenuResponseDTO(
            menu=normalized_menu,
            categories=categories,
            updatedAt=document.get("updatedAt"),
        ),
    )


@router.put(
    "/{tenant_public_id}/menu",
    status_code=status.HTTP_200_OK,
    response_model=UpdatedResponse[TenantMenuResponseDTO],
    summary="Create or update tenant menu",
    description="Save menu definition for a tenant in MongoDB",
)
async def upsert_tenant_menu(
    tenant_public_id: str,
    _tenant_id: AuthorizedTenantId,
    payload: UpsertTenantMenuDTO,
    db: MongoDB,
) -> UpdatedResponse[TenantMenuResponseDTO]:
    _validate_payload(payload)

    raw_menu = _build_raw_menu(payload)
    now = datetime.now(UTC)

    await db[MENU_COLLECTION].update_one(
        {"tenantPublicId": tenant_public_id},
        {"$set": {"tenantPublicId": tenant_public_id, "menu": raw_menu, "updatedAt": now}},
        upsert=True,
    )

    return UpdatedResponse(
        message="Tenant menu saved successfully",
        data=TenantMenuResponseDTO(
            menu=raw_menu,
            categories=normalize_mongo_menu_categories(raw_menu),
            updatedAt=now,
        ),
    )
