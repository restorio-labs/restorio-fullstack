from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette import status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from core.foundation.security import security_service


class UnauthorizedMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: ASGIApp) -> None:
        self._security = security_service
        super().__init__(app)

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Allow public routes
        if (
            request.method == "OPTIONS"
            or request.url.path.startswith("/docs")
            or request.url.path.startswith("/openapi")
            or request.url.path.startswith("/health")
            or request.url.path.startswith("/api/v1/auth")
        ):
            return await call_next(request)

        auth_header = request.headers.get("Authorization")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"message": "Unauthorized"},
            )

        token = auth_header.split(" ", 1)[1]

        try:
            user = self._security.decode_access_token(token)  # should raise if invalid
        except Exception:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"message": "Unauthorized"},
            )

        # Attach user to request context
        request.state.user = user

        return await call_next(request)
