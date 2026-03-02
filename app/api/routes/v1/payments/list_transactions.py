from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status

from core.dto.v1.payments import TransactionListItemDTO, TransactionListQueryDTO
from core.foundation.dependencies import P24ServiceDep, PostgresSession
from core.foundation.http.responses import PaginatedResponse

router = APIRouter()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=PaginatedResponse[TransactionListItemDTO],
)
async def list_transactions(
    tenant_id: UUID,
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
