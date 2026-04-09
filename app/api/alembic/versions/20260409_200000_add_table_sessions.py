"""add table sessions

Revision ID: 20260409_table_sessions
Revises: 20260409_merge_mobile_tx
Create Date: 2026-04-09 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = "20260409_table_sessions"
down_revision: Union[str, tuple[str, ...], None] = "20260409_merge_mobile_tx"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


table_session_origin = sa.Enum("mobile", "waiter", name="table_session_origin")
table_session_status = sa.Enum(
    "active",
    "released",
    "expired",
    "completed",
    name="table_session_status",
)


def upgrade() -> None:
    table_session_origin.create(op.get_bind(), checkfirst=True)
    table_session_status.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "table_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("waiter_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("tenant_public_id", sa.String(length=64), nullable=False),
        sa.Column("tenant_slug", sa.String(length=255), nullable=True),
        sa.Column("table_ref", sa.String(length=255), nullable=False),
        sa.Column("table_number", sa.Integer(), nullable=True),
        sa.Column("table_label", sa.String(length=255), nullable=True),
        sa.Column("lock_token", sa.String(length=128), nullable=False),
        sa.Column("origin", table_session_origin, nullable=False),
        sa.Column("status", table_session_status, nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=True),
        sa.Column("client_fingerprint_hash", sa.String(length=128), nullable=True),
        sa.Column("ip_hash", sa.String(length=128), nullable=True),
        sa.Column("acquired_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["waiter_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("lock_token"),
    )
    op.create_index(
        "idx_table_sessions_tenant_table",
        "table_sessions",
        ["tenant_id", "table_ref"],
        unique=False,
    )
    op.create_index(
        "idx_table_sessions_status_expires",
        "table_sessions",
        ["status", "expires_at"],
        unique=False,
    )
    op.create_index(
        "idx_table_sessions_session_id",
        "table_sessions",
        ["session_id"],
        unique=False,
    )
    op.create_index(
        "uq_table_sessions_active_tenant_table",
        "table_sessions",
        ["tenant_id", "table_ref"],
        unique=True,
        postgresql_where=sa.text("status = 'active'"),
    )


def downgrade() -> None:
    op.drop_index("uq_table_sessions_active_tenant_table", table_name="table_sessions")
    op.drop_index("idx_table_sessions_session_id", table_name="table_sessions")
    op.drop_index("idx_table_sessions_status_expires", table_name="table_sessions")
    op.drop_index("idx_table_sessions_tenant_table", table_name="table_sessions")
    op.drop_table("table_sessions")
    table_session_status.drop(op.get_bind(), checkfirst=True)
    table_session_origin.drop(op.get_bind(), checkfirst=True)
