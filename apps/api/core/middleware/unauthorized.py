from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from core.consts.status_codes import NOT_FOUND_STATUS_CODE, UNAUTHORIZED_STATUS_CODE


class UnauthorizedMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        if response.status_code == NOT_FOUND_STATUS_CODE:
            return JSONResponse(
                status_code=UNAUTHORIZED_STATUS_CODE,
                content={"message": "Unauthorized"},
            )

        return response
