from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_orders() -> dict[str, str]:
    return {"message": "List orders endpoint - to be implemented"}


@router.get("/{order_id}")
async def get_order(order_id: str) -> dict[str, str]:
    return {"message": f"Get order {order_id} endpoint - to be implemented"}


@router.post("")
async def create_order() -> dict[str, str]:
    return {"message": "Create order endpoint - to be implemented"}


@router.put("/{order_id}")
async def update_order(order_id: str) -> dict[str, str]:
    return {"message": f"Update order {order_id} endpoint - to be implemented"}


@router.delete("/{order_id}")
async def delete_order(order_id: str) -> dict[str, str]:
    return {"message": f"Delete order {order_id} endpoint - to be implemented"}

