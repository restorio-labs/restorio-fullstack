"""add tenant profile geolocation

Revision ID: 20260719_profile_geolocation
Revises: 20260503_password_reset
Create Date: 2026-07-19

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260719_profile_geolocation"
down_revision: Union[str, None] = "20260503_password_reset"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

geocoding_status_enum = postgresql.ENUM(
    "not_geocoded",
    "pending",
    "geocoded",
    "failed",
    name="geocoding_status",
    create_type=False,
)
location_source_enum = postgresql.ENUM(
    "geocoder",
    "manual",
    "imported",
    name="location_source",
    create_type=False,
)
location_precision_enum = postgresql.ENUM(
    "rooftop",
    "interpolated",
    "street",
    "postal_code",
    "city",
    "approximate",
    name="location_precision",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis")
    geocoding_status_enum.create(bind, checkfirst=True)
    location_source_enum.create(bind, checkfirst=True)
    location_precision_enum.create(bind, checkfirst=True)

    op.add_column(
        "tenant_profiles",
        sa.Column("latitude", sa.Numeric(precision=9, scale=6), nullable=True),
    )
    op.add_column(
        "tenant_profiles",
        sa.Column("longitude", sa.Numeric(precision=10, scale=6), nullable=True),
    )
    op.add_column(
        "tenant_profiles",
        sa.Column(
            "geocoding_status",
            geocoding_status_enum,
            nullable=False,
            server_default="not_geocoded",
        ),
    )
    op.add_column(
        "tenant_profiles",
        sa.Column("location_source", location_source_enum, nullable=True),
    )
    op.add_column(
        "tenant_profiles",
        sa.Column("location_precision", location_precision_enum, nullable=True),
    )
    op.add_column(
        "tenant_profiles",
        sa.Column("is_location_public", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute(
        """
        ALTER TABLE tenant_profiles
        ADD COLUMN location geography(Point, 4326)
        GENERATED ALWAYS AS (
            CASE
                WHEN latitude IS NOT NULL AND longitude IS NOT NULL
                THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            END
        ) STORED
        """
    )

    op.create_check_constraint(
        "check_tenant_profile_coordinate_pair",
        "tenant_profiles",
        "(latitude IS NULL) = (longitude IS NULL)",
    )
    op.create_check_constraint(
        "check_tenant_profile_latitude_range",
        "tenant_profiles",
        "latitude IS NULL OR latitude BETWEEN -90 AND 90",
    )
    op.create_check_constraint(
        "check_tenant_profile_longitude_range",
        "tenant_profiles",
        "longitude IS NULL OR longitude BETWEEN -180 AND 180",
    )
    op.create_check_constraint(
        "check_tenant_profile_public_location",
        "tenant_profiles",
        "NOT is_location_public OR location IS NOT NULL",
    )
    op.create_check_constraint(
        "check_tenant_profile_location_source",
        "tenant_profiles",
        "location_source IS NULL OR location IS NOT NULL",
    )
    op.create_check_constraint(
        "check_tenant_profile_location_precision",
        "tenant_profiles",
        "location_precision IS NULL OR location IS NOT NULL",
    )
    op.create_index(
        "ix_tenant_profiles_location_gist",
        "tenant_profiles",
        ["location"],
        unique=False,
        postgresql_using="gist",
        postgresql_where=sa.text("location IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_tenant_profiles_location_gist", table_name="tenant_profiles")
    op.drop_constraint("check_tenant_profile_location_precision", "tenant_profiles", type_="check")
    op.drop_constraint("check_tenant_profile_location_source", "tenant_profiles", type_="check")
    op.drop_constraint("check_tenant_profile_public_location", "tenant_profiles", type_="check")
    op.drop_constraint("check_tenant_profile_longitude_range", "tenant_profiles", type_="check")
    op.drop_constraint("check_tenant_profile_latitude_range", "tenant_profiles", type_="check")
    op.drop_constraint("check_tenant_profile_coordinate_pair", "tenant_profiles", type_="check")
    op.drop_column("tenant_profiles", "location")
    op.drop_column("tenant_profiles", "is_location_public")
    op.drop_column("tenant_profiles", "location_precision")
    op.drop_column("tenant_profiles", "location_source")
    op.drop_column("tenant_profiles", "geocoding_status")
    op.drop_column("tenant_profiles", "longitude")
    op.drop_column("tenant_profiles", "latitude")

    bind = op.get_bind()
    location_precision_enum.drop(bind, checkfirst=True)
    location_source_enum.drop(bind, checkfirst=True)
    geocoding_status_enum.drop(bind, checkfirst=True)
