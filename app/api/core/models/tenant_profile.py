from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Numeric,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from core.foundation.database.database import Base
from core.foundation.database.types import GeographyPoint
from core.models.enums import GeocodingStatus, LocationPrecision, LocationSource

if TYPE_CHECKING:
    from core.models.tenant import Tenant


class TenantProfile(Base):
    __tablename__ = "tenant_profiles"
    __table_args__ = (
        CheckConstraint(
            "(latitude IS NULL) = (longitude IS NULL)",
            name="check_tenant_profile_coordinate_pair",
        ),
        CheckConstraint(
            "latitude IS NULL OR latitude BETWEEN -90 AND 90",
            name="check_tenant_profile_latitude_range",
        ),
        CheckConstraint(
            "longitude IS NULL OR longitude BETWEEN -180 AND 180",
            name="check_tenant_profile_longitude_range",
        ),
        CheckConstraint(
            "NOT is_location_public OR location IS NOT NULL",
            name="check_tenant_profile_public_location",
        ),
        CheckConstraint(
            "location_source IS NULL OR location IS NOT NULL",
            name="check_tenant_profile_location_source",
        ),
        CheckConstraint(
            "location_precision IS NULL OR location IS NOT NULL",
            name="check_tenant_profile_location_precision",
        ),
        Index(
            "ix_tenant_profiles_location_gist",
            "location",
            postgresql_using="gist",
            postgresql_where=text("location IS NOT NULL"),
        ),
    )

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    tenant_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    nip: Mapped[str] = mapped_column(String(10), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    logo: Mapped[str | None] = mapped_column("logo_url", String(512), nullable=True)

    contact_email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)

    address_street_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address_street_number: Mapped[str] = mapped_column(String(20), nullable=False)
    address_city: Mapped[str] = mapped_column(String(100), nullable=False)
    address_postal_code: Mapped[str] = mapped_column(String(10), nullable=False)
    address_country: Mapped[str] = mapped_column(String(100), nullable=False, default="Polska")

    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), nullable=True)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(10, 6), nullable=True)
    geocoding_status: Mapped[GeocodingStatus] = mapped_column(
        Enum(
            GeocodingStatus,
            name="geocoding_status",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=False,
        default=GeocodingStatus.NOT_GEOCODED,
        server_default=GeocodingStatus.NOT_GEOCODED.value,
    )
    location_source: Mapped[LocationSource | None] = mapped_column(
        Enum(
            LocationSource,
            name="location_source",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=True,
    )
    location_precision: Mapped[LocationPrecision | None] = mapped_column(
        Enum(
            LocationPrecision,
            name="location_precision",
            values_callable=lambda enum: [item.value for item in enum],
        ),
        nullable=True,
    )
    is_location_public: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default="false"
    )
    location: Mapped[object | None] = mapped_column(
        GeographyPoint(),
        Computed(
            "CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL "
            "THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography END",
            persisted=True,
        ),
        nullable=True,
        deferred=True,
    )

    owner_first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    owner_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    owner_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    contact_person_first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_person_last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    contact_person_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_person_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)

    social_facebook: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_instagram: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_tiktok: Mapped[str | None] = mapped_column(String(512), nullable=True)
    social_website: Mapped[str | None] = mapped_column(String(512), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now()
    )

    tenant: Mapped[Tenant] = relationship("Tenant", back_populates="tenant_profile")
