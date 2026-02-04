"""Fix tenant status enum values

Revision ID: 7c8f2c7b2c9a
Revises: 3b4a9e5a8b12
Create Date: 2026-01-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "7c8f2c7b2c9a"
down_revision: Union[str, None] = "3b4a9e5a8b12"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE tenant_status_new AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE')")
    op.execute(
        """
        ALTER TABLE tenants
        ALTER COLUMN status
        TYPE tenant_status_new
        USING (
            CASE
                WHEN status::text = 'TenantStatus' THEN 'ACTIVE'
                ELSE status::text
            END
        )::tenant_status_new
        """
    )
    op.execute("DROP TYPE tenant_status")
    op.execute("ALTER TYPE tenant_status_new RENAME TO tenant_status")


def downgrade() -> None:
    op.execute("CREATE TYPE tenant_status_old AS ENUM ('TenantStatus')")
    op.execute(
        """
        ALTER TABLE tenants
        ALTER COLUMN status
        TYPE tenant_status_old
        USING ('TenantStatus'::tenant_status_old)
        """
    )
    op.execute("DROP TYPE tenant_status")
    op.execute("ALTER TYPE tenant_status_old RENAME TO tenant_status")
