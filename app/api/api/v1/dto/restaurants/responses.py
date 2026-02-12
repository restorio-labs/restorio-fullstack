from datetime import datetime

from pydantic import Field

from api.v1.dto.common import BaseDTO, EntityId


class RestaurantTableResponseDTO(BaseDTO):
    id: EntityId = Field(..., description="Table identifier")
    tenant_id: EntityId = Field(..., description="Tenant identifier")
    label: str = Field(..., description="Table label/number")
    capacity: int = Field(..., description="Maximum seating capacity")
    is_active: bool = Field(..., description="Whether table is active")
    created_at: datetime = Field(..., description="Timestamp when table was created")
