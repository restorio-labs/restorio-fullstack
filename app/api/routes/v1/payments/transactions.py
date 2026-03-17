from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from core.dto.v1.payments import TransactionListItemDTO, TransactionListQueryDTO
from core.foundation.dependencies import P24ServiceDep, PostgresSession
from core.foundation.http.responses import PaginatedResponse
from core.foundation.tenant_guard import resolve_and_authorize_tenant

router = APIRouter()


async def resolve_transactions_tenant_id(
    request: Request,
    session: PostgresSession,
    tenant_public_id: str | None = Query(default=None),
    tenant_id: str | None = Query(default=None),
) -> UUID:
    resolved_public_id = tenant_public_id or tenant_id
    if resolved_public_id is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="tenant_public_id or tenant_id is required",
        )

    return await resolve_and_authorize_tenant(
        tenant_public_id=resolved_public_id,
        request=request,
        session=session,
    )


@router.get(
    "/transactions",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[TransactionListItemDTO],
)
async def list_transactions(
    tenant_id: Annotated[UUID, Depends(resolve_transactions_tenant_id)],
    session: PostgresSession,
    p24_service: P24ServiceDep,
    query: Annotated[TransactionListQueryDTO, Depends()],
) -> PaginatedResponse[TransactionListItemDTO]:
    transactions, total = await p24_service.get_transactions_page(
        session,
        tenant_id,
        date_from=query.date_from,
        date_to=query.date_to,
        page=query.page,
        pagination=query.pagination,
    )

    items = [TransactionListItemDTO.model_validate(t) for t in transactions]

    return PaginatedResponse.create(
        items=items,
        total=total,
        page=query.page,
        page_size=query.pagination,
    )
