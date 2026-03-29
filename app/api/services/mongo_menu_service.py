from core.dto.v1.menus import MenuCategoryDTO, MenuItemDTO

MENU_COLLECTION = "menus"
CATEGORY_META_KEY = "__category"


def normalize_mongo_menu_categories(
    raw_menu: dict[str, dict],
    *,
    active_items_only: bool = False,
) -> list[MenuCategoryDTO]:
    categories: list[MenuCategoryDTO] = []

    for order_key in sorted(
        raw_menu.keys(), key=lambda value: int(value) if value.isdigit() else value
    ):
        category_data = raw_menu.get(order_key)
        if not isinstance(category_data, dict):
            continue

        meta = category_data.get(CATEGORY_META_KEY, {})
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
            if item_name == CATEGORY_META_KEY or not isinstance(item_payload, dict):
                continue

            raw_price = item_payload.get("price", 0)
            raw_promoted = item_payload.get("promoted", 0)
            raw_active = item_payload.get("active", 1)
            raw_desc = item_payload.get("desc", "")
            raw_tags = item_payload.get("tags", [])

            price = float(raw_price) if isinstance(raw_price, int | float) else 0.0
            promoted = 1 if raw_promoted == 1 else 0
            active = 0 if raw_active == 0 else 1
            desc = raw_desc if isinstance(raw_desc, str) else ""
            tags = (
                [tag for tag in raw_tags if isinstance(tag, str)]
                if isinstance(raw_tags, list)
                else []
            )

            if active_items_only and active == 0:
                continue

            items.append(
                MenuItemDTO(
                    name=item_name,
                    price=price,
                    promoted=promoted,
                    active=active,
                    desc=desc,
                    tags=tags,
                )
            )

        if active_items_only and not items:
            continue

        categories.append(
            MenuCategoryDTO(
                name=category_name,
                order=category_order,
                items=items,
            )
        )

    return sorted(categories, key=lambda category: category.order)
