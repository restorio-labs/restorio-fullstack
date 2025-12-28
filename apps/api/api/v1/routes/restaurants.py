from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_restaurants() -> dict[str, str]:
    return {"message": "List restaurants endpoint - to be implemented"}


@router.get("/{restaurant_id}")
async def get_restaurant(restaurant_id: str) -> dict[str, str]:
    return {"message": f"Get restaurant {restaurant_id} endpoint - to be implemented"}


@router.post("")
async def create_restaurant() -> dict[str, str]:
    return {"message": "Create restaurant endpoint - to be implemented"}


@router.put("/{restaurant_id}")
async def update_restaurant(restaurant_id: str) -> dict[str, str]:
    return {"message": f"Update restaurant {restaurant_id} endpoint - to be implemented"}


@router.delete("/{restaurant_id}")
async def delete_restaurant(restaurant_id: str) -> dict[str, str]:
    return {"message": f"Delete restaurant {restaurant_id} endpoint - to be implemented"}

