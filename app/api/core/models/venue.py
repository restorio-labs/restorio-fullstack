from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base

if TYPE_CHECKING:
    from core.models.floor_canvas import FloorCanvas
    from core.models.tenant import Tenant


class Venue(Base):
    __tablename__ = "venues"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    active_layout_version_id: Mapped[UUID | None] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("floor_canvases.id", ondelete="SET NULL", use_alter=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="venues")
    floor_canvases: Mapped[list[FloorCanvas]] = relationship(
        "FloorCanvas",
        back_populates="venue",
        cascade="all, delete-orphan",
        foreign_keys="FloorCanvas.venue_id",
    )

    __table_args__ = (Index("idx_venues_tenant_id", "tenant_id"),)
