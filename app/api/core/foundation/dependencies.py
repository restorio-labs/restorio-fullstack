from typing import Annotated

from asyncpg import Pool
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from sqlalchemy.ext.asyncio import AsyncSession

from core.foundation.database.connection import get_mongo_db, get_postgres_pool
from core.foundation.database.database import get_db_session
from core.foundation.security import SecurityService, security_service
from services.auth_service import AuthService
from services.email_service import EmailService
from services.external_client_service import ExternalClient
from services.floor_canvas_service import FloorCanvasService
from services.payment_service import P24Service
from services.tenant_service import TenantService
from services.user_service import UserService


def get_user_service() -> UserService:
    return UserService(security=security_service)


async def get_mongo_database() -> AsyncIOMotorDatabase:
    return get_mongo_db()


async def get_postgres_connection_pool() -> Pool:
    return await get_postgres_pool()


def get_security_service() -> SecurityService:
    return security_service


def get_auth_service(
    security: SecurityService = Depends(get_security_service),
) -> AuthService:
    return AuthService(security=security)


def get_email_service() -> EmailService:
    return EmailService()


def get_tenant_service() -> TenantService:
    return TenantService()


def get_floor_canvas_service() -> FloorCanvasService:
    return FloorCanvasService()


def get_p24_service() -> P24Service:
    return P24Service()


def get_external_client() -> ExternalClient:
    return ExternalClient()


SecurityServiceDep = Annotated[SecurityService, Depends(get_security_service)]
AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]
EmailServiceDep = Annotated[EmailService, Depends(get_email_service)]
TenantServiceDep = Annotated[TenantService, Depends(get_tenant_service)]
FloorCanvasServiceDep = Annotated[FloorCanvasService, Depends(get_floor_canvas_service)]
P24ServiceDep = Annotated[P24Service, Depends(get_p24_service)]
ExternalClientDep = Annotated[ExternalClient, Depends(get_external_client)]
UserServiceDep = Annotated[UserService, Depends(get_user_service)]

MongoDB = Annotated[AsyncIOMotorDatabase, Depends(get_mongo_database)]
PostgresPool = Annotated[Pool, Depends(get_postgres_connection_pool)]
PostgresSession = Annotated[AsyncSession, Depends(get_db_session)]
