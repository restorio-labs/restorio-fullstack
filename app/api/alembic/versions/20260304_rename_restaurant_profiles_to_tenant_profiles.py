"""rename_restaurant_profiles_to_tenant_profiles

Revision ID: c4d5e6f7a8b9
Revises: 8a9b0c1d2e3f
Create Date: 2026-03-04 21:50:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "c4d5e6f7a8b9"
down_revision: Union[str, None] = "8a9b0c1d2e3f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("restaurant_profiles", "tenant_profiles")


def downgrade() -> None:
    op.rename_table("tenant_profiles", "restaurant_profiles")
