from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

from core.exceptions import BaseHTTPException
from core.foundation.http.responses import ErrorResponse
from core.foundation.infra.config import Settings


def setup_exception_handlers(app: FastAPI, settings: Settings) -> None:
    @app.exception_handler(BaseHTTPException)
    async def restorio_exception_handler(
        _: Request,
        exc: BaseHTTPException,
    ) -> JSONResponse:
        if settings.DEBUG:
            content = ErrorResponse(message=exc.detail, details=exc.details).model_dump(
                exclude_none=True
            )
        else:
            content = ErrorResponse(message="An error occurred", details=None).model_dump(
                exclude_none=True
            )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=content,
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        _: Request,
        exc: Exception,
    ) -> JSONResponse:
        if settings.DEBUG:
            content = ErrorResponse(
                message="An unexpected error occurred",
                details={"type": type(exc).__name__},
            ).model_dump(exclude_none=True)
        else:
            content = ErrorResponse(
                message="An unexpected error occurred", details=None
            ).model_dump(exclude_none=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=content,
        )
