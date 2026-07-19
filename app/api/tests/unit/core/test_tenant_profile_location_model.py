from sqlalchemy import CheckConstraint
from sqlalchemy.dialects import postgresql

from core.models.tenant_profile import TenantProfile


def test_location_column_is_generated_postgis_geography() -> None:
    column = TenantProfile.__table__.c.location

    assert column.computed is not None
    assert "ST_MakePoint(longitude, latitude)" in str(column.computed.sqltext)
    assert column.type.compile(dialect=postgresql.dialect()) == "geography(POINT,4326)"


def test_location_constraints_and_index_are_registered() -> None:
    constraints = {
        constraint.name
        for constraint in TenantProfile.__table__.constraints
        if isinstance(constraint, CheckConstraint)
    }
    indexes = {index.name for index in TenantProfile.__table__.indexes}

    assert "check_tenant_profile_coordinate_pair" in constraints
    assert "check_tenant_profile_public_location" in constraints
    assert "ix_tenant_profiles_location_gist" in indexes
