import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, MetaData, Uuid, func
from sqlalchemy.orm import DeclarativeBase, Mapped, declared_attr, mapped_column

from payproof.core.ids import uuid7

TENANT_COLUMN = "payproof.tenant"

# stable constraint names so Alembic migrations can drop/alter them
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=NAMING_CONVENTION)


class IdMixin:
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid7)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TenantMixin:
    """Business tables: `company_id` is set from the session's membership, never from input."""

    @declared_attr
    def company_id(cls) -> Mapped[uuid.UUID]:
        # info marker lets the tenant guard spot these tables anywhere in a statement
        return mapped_column(
            Uuid, ForeignKey("companies.id"), index=True, info={TENANT_COLUMN: True}
        )


class TenantEntity(IdMixin, TimestampMixin, TenantMixin):
    """Default columns of a business table: `class Customer(TenantEntity, Base)`."""
