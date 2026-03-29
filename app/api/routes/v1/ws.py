import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from services.ws_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/kitchen/{restaurant_id}")
async def kitchen_websocket(websocket: WebSocket, restaurant_id: str) -> None:
    await ws_manager.connect(restaurant_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(restaurant_id, websocket)
    except Exception:
        ws_manager.disconnect(restaurant_id, websocket)
