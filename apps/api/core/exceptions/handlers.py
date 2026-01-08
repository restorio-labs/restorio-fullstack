from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from core.foundation.infra.config import Settings
from core.exceptions import BaseHTTPException
from core.foundation.http.schemas import ErrorResponse


def setup_exception_handlers(app: FastAPI, settings: Settings) -> None:
    @app.exception_handler(BaseHTTPException)
    async def restorio_exception_handler(
        _: Request,
        exc: BaseHTTPException,
    ) -> JSONResponse:
        error_response = ErrorResponse(
            error_code=exc.error_code,
            message=exc.detail,
            details=exc.details,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response.model_dump(exclude_none=True),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        _: Request,
        exc: Exception,
    ) -> JSONResponse:
        error_response = ErrorResponse(
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred",
            details={"type": type(exc).__name__} if settings.DEBUG else None,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response.model_dump(exclude_none=True),
        )
