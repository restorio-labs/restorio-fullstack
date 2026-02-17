from typing import Literal

from pydantic import Field

from api.v1.dto.common import BaseDTO, EntityId


class FloorElementBaseDTO(BaseDTO):
    id: str = Field(..., description="Element identifier")
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    w: float = Field(..., description="Width")
    h: float = Field(..., description="Height")
    rotation: float | None = Field(None, description="Rotation in degrees")
    zone_id: str | None = Field(None, alias="zoneId", description="Associated zone id")


class FloorTableElementDTO(FloorElementBaseDTO):
    type: Literal["table"] = "table"
    table_number: str = Field(..., alias="tableNumber", description="Table display number")
    seats: int = Field(..., gt=0, description="Number of seats")
    table_id: str | None = Field(None, alias="tableId", description="Reference to RestaurantTable")


class FloorTableGroupElementDTO(FloorElementBaseDTO):
    type: Literal["tableGroup"] = "tableGroup"
    table_numbers: list[str] = Field(..., alias="tableNumbers", description="Table display numbers")
    seats: int = Field(..., gt=0, description="Total seats")
    table_ids: list[str] | None = Field(
        None, alias="tableIds", description="References to RestaurantTables"
    )


class FloorBarElementDTO(FloorElementBaseDTO):
    type: Literal["bar"] = "bar"
    label: str | None = Field(None, description="Bar label")


class FloorZoneElementDTO(FloorElementBaseDTO):
    type: Literal["zone"] = "zone"
    name: str = Field(..., description="Zone name")
    color: str | None = Field(None, description="Zone color (hex)")


class FloorWallElementDTO(FloorElementBaseDTO):
    type: Literal["wall"] = "wall"


class FloorEntranceElementDTO(FloorElementBaseDTO):
    type: Literal["entrance"] = "entrance"
    label: str | None = Field(None, description="Entrance label")


FloorElementDTO = (
    FloorTableElementDTO
    | FloorTableGroupElementDTO
    | FloorBarElementDTO
    | FloorZoneElementDTO
    | FloorWallElementDTO
    | FloorEntranceElementDTO
)


class CreateFloorCanvasDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Canvas name")
    width: int = Field(800, gt=0, description="Canvas width in pixels")
    height: int = Field(600, gt=0, description="Canvas height in pixels")
    elements: list[FloorElementDTO] = Field(default_factory=list, description="Floor elements")


class UpdateFloorCanvasDTO(BaseDTO):
    name: str | None = Field(None, min_length=1, max_length=255, description="Canvas name")
    width: int | None = Field(None, gt=0, description="Canvas width in pixels")
    height: int | None = Field(None, gt=0, description="Canvas height in pixels")
    elements: list[FloorElementDTO] | None = Field(None, description="Floor elements")


class CreateVenueDTO(BaseDTO):
    name: str = Field(..., min_length=1, max_length=255, description="Venue name")


class UpdateVenueDTO(BaseDTO):
    name: str | None = Field(None, min_length=1, max_length=255, description="Venue name")
    active_layout_version_id: EntityId | None = Field(
        None, alias="activeLayoutVersionId", description="Active floor canvas id"
    )
