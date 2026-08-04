"""Add tenant access groups

Revision ID: 20260803_access_groups
Revises: 20260719_profile_geolocation
Create Date: 2026-08-03 12:00:00.000000
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "20260803_access_groups"
down_revision: str | None = "20260719_profile_geolocation"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "access_groups",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("name_normalized", sa.String(length=200), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("capabilities", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "tenant_id",
            "name_normalized",
            name="uq_access_groups_tenant_name_normalized",
        ),
    )
    op.create_index("ix_access_groups_tenant_id", "access_groups", ["tenant_id"], unique=False)
    op.create_table(
        "access_group_assignments",
        sa.Column("group_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("account_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(
            ["account_id", "tenant_id"],
            ["tenant_roles.account_id", "tenant_roles.tenant_id"],
            name="fk_access_group_assignments_membership",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["group_id"], ["access_groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("group_id", "account_id"),
    )


def downgrade() -> None:
    op.drop_table("access_group_assignments")
    op.drop_index("ix_access_groups_tenant_id", table_name="access_groups")
    op.drop_table("access_groups")
