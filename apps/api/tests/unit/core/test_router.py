from fastapi import APIRouter, Request, Response
from fastapi.routing import APIRoute

from core.foundation.http.router import RouterSingleton, TimedRoute, create_router


class TestRouterSingleton:
    def test_singleton_pattern(self) -> None:
        instance1 = RouterSingleton()
        instance2 = RouterSingleton()

        assert instance1 is instance2

    def test_router_property_creates_router(self) -> None:
        singleton = RouterSingleton()
        router = singleton.router

        assert isinstance(router, APIRouter)

    def test_router_property_returns_same_instance(self) -> None:
        singleton = RouterSingleton()
        router1 = singleton.router
        router2 = singleton.router

        assert router1 is router2

    def test_reset_clears_router(self) -> None:
        singleton = RouterSingleton()
        router1 = singleton.router
        singleton.reset()
        router2 = singleton.router

        assert router1 is not router2


class TestCreateRouter:
    def test_create_router_with_defaults(self) -> None:
        router = create_router()

        assert isinstance(router, APIRouter)
        assert router.prefix == ""

    def test_create_router_with_prefix(self) -> None:
        router = create_router(prefix="/api/v1")

        assert isinstance(router, APIRouter)
        assert router.prefix == "/api/v1"

    def test_create_router_with_tags(self) -> None:
        tags = ["users", "auth"]
        router = create_router(tags=tags)

        assert isinstance(router, APIRouter)
        assert router.tags == tags

    def test_create_router_with_dependencies(self) -> None:
        dependencies = []
        router = create_router(dependencies=dependencies)

        assert isinstance(router, APIRouter)
        assert router.dependencies == dependencies


class TestTimedRoute:
    def test_timed_route_is_apiroute_subclass(self) -> None:
        assert issubclass(TimedRoute, APIRoute)

    async def test_timed_route_adds_header(self) -> None:
        async def endpoint() -> Response:
            return Response(content="ok")

        route = TimedRoute(
            path="/",
            endpoint=endpoint,
            methods=["GET"],
        )

        handler = route.get_route_handler()

        scope = {
            "type": "http",
            "method": "GET",
            "path": "/",
            "headers": [],
            "query_string": b"",
        }
        request = Request(scope)

        response = await handler(request)

        assert "X-Process-Time" in response.headers
