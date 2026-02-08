"""Add user account type

Revision ID: 3b4a9e5a8b12
Revises: 0a3b1e6d9c52
Create Date: 2026-01-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "3b4a9e5a8b12"
down_revision: Union[str, None] = "0a3b1e6d9c52"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    account_type_enum = sa.Enum("owner", "waiter", "kitchen", name="account_type")
    account_type_enum.create(op.get_bind(), checkfirst=True)
    op.add_column(
        "users",
        sa.Column(
            "account_type",
            account_type_enum,
            nullable=False,
            server_default="owner",
        ),
    )
    op.drop_column("users", "display_name")
    op.alter_column("users", "account_type", server_default=None)


def downgrade() -> None:
    account_type_enum = sa.Enum("owner", "waiter", "kitchen", name="account_type")
    op.add_column("users", sa.Column("display_name", sa.String(length=255), nullable=True))
    op.drop_column("users", "account_type")
    account_type_enum.drop(op.get_bind(), checkfirst=False)
