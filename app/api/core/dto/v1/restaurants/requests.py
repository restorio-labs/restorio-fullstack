from pydantic import Field

from core.dto.v1.common import BaseDTO


class CreateRestaurantTableDTO(BaseDTO):
    label: str = Field(..., min_length=1, max_length=50, description="Table label/number")
    capacity: int = Field(..., gt=0, description="Maximum seating capacity")
    is_active: bool = Field(default=True, description="Whether table is active")


class UpdateRestaurantTableDTO(BaseDTO):
    label: str | None = Field(None, min_length=1, max_length=50, description="Table label/number")
    capacity: int | None = Field(None, gt=0, description="Maximum seating capacity")
    is_active: bool | None = Field(None, description="Whether table is active")
