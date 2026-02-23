from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Query, status

from core.dto.v1.payments import TransactionListItemDTO
from core.foundation.dependencies import P24ServiceDep, PostgresSession
from core.foundation.http.responses import PaginatedResponse

router = APIRouter()

MAX_PAGE_SIZE = 100
DEFAULT_PAGE_SIZE = 20


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[TransactionListItemDTO],
)
async def list_transactions(
    tenant_id: UUID,
    session: PostgresSession,
    p24_service: P24ServiceDep,
    date_from: Annotated[date | None, Query()] = None,
    date_to: Annotated[date | None, Query()] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=MAX_PAGE_SIZE)] = DEFAULT_PAGE_SIZE,
) -> PaginatedResponse[TransactionListItemDTO]:
    transactions, total = await p24_service.list_transactions(
        session,
        tenant_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )

    items = [TransactionListItemDTO.model_validate(t) for t in transactions]

    return PaginatedResponse.create(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )
