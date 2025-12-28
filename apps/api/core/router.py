from typing import Callable

from fastapi import APIRouter, Request, Response
from fastapi.routing import APIRoute


class RouterSingleton:
    _instance: "RouterSingleton | None" = None
    _router: APIRouter | None = None

    def __new__(cls) -> "RouterSingleton":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    @property
    def router(self) -> APIRouter:
        if self._router is None:
            self._router = APIRouter()
        return self._router

    def reset(self) -> None:
        self._router = None


def create_router(
    prefix: str = "",
    tags: list[str] | None = None,
    dependencies: list | None = None,
) -> APIRouter:
    return APIRouter(
        prefix=prefix,
        tags=tags or [],
        dependencies=dependencies or [],
    )


class TimedRoute(APIRoute):
    def get_route_handler(self) -> Callable:
        original_route_handler = super().get_route_handler()

        async def custom_route_handler(request: Request) -> Response:
            import time

            before = time.time()
            response: Response = await original_route_handler(request)
            duration = time.time() - before
            response.headers["X-Process-Time"] = str(duration)
            return response

        return custom_route_handler

