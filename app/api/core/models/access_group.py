from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    JSON,
    DateTime,
    ForeignKey,
    ForeignKeyConstraint,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base

if TYPE_CHECKING:
    from core.models.tenant import Tenant
    from core.models.user import User


class AccessGroup(Base):
    __tablename__ = "access_groups"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "name_normalized",
            name="uq_access_groups_tenant_name_normalized",
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    name_normalized: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    capabilities: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="access_groups")
    assignments: Mapped[list[AccessGroupAssignment]] = relationship(
        "AccessGroupAssignment", back_populates="group", cascade="all, delete-orphan"
    )


class AccessGroupAssignment(Base):
    __tablename__ = "access_group_assignments"
    __table_args__ = (
        ForeignKeyConstraint(
            ["account_id", "tenant_id"],
            ["tenant_roles.account_id", "tenant_roles.tenant_id"],
            ondelete="CASCADE",
            name="fk_access_group_assignments_membership",
        ),
    )

    group_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("access_groups.id", ondelete="CASCADE"),
        primary_key=True,
    )
    account_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    tenant_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    group: Mapped[AccessGroup] = relationship("AccessGroup", back_populates="assignments")
    account: Mapped[User] = relationship("User")
