from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import DateTime, Enum, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base
from core.models.enums import TenantStatus

if TYPE_CHECKING:
    from core.models.audit_log import AuditLog
    from core.models.order import Order
    from core.models.restaurant_table import RestaurantTable
    from core.models.user_tenant import UserTenant
    from core.models.venue import Venue


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[TenantStatus] = mapped_column(
        Enum(TenantStatus, name="tenant_status", create_constraint=True),
        nullable=False,
        default=TenantStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    user_tenants: Mapped[list[UserTenant]] = relationship(
        "UserTenant", back_populates="tenant", cascade="all, delete-orphan"
    )
    restaurant_tables: Mapped[list[RestaurantTable]] = relationship(
        "RestaurantTable", back_populates="tenant", cascade="all, delete-orphan"
    )
    orders: Mapped[list[Order]] = relationship(
        "Order", back_populates="tenant", cascade="all, delete-orphan"
    )
    audit_logs: Mapped[list[AuditLog]] = relationship(
        "AuditLog", back_populates="tenant", cascade="all, delete-orphan"
    )
    venues: Mapped[list[Venue]] = relationship(
        "Venue", back_populates="tenant", cascade="all, delete-orphan"
    )
