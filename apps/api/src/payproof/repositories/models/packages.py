import datetime as dt
import uuid

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Integer,
    String,
    Text,
    UniqueConstraint,
    false,
)
from sqlalchemy.orm import Mapped, mapped_column

from payproof.repositories.orm import (
    CURRENCIES,
    Base,
    TenantEntity,
    member_fk,
    one_of,
    same_tenant_fk,
    tenant_key,
)

# shortcut: mirrors `OrderLink.method` in openapi.yaml; switch to domain enums once B-06 adds them
LINK_METHODS = ("exact_id", "human")


class InvoicePackage(TenantEntity, Base):
    """One invoice with its documents; `version` bumps on every material change."""

    __tablename__ = "invoice_packages"
    __table_args__ = (
        UniqueConstraint("company_id", "customer_id", "invoice_number"),
        tenant_key(),
        same_tenant_fk("customer_id", "customers"),
        same_tenant_fk("order_id", "orders"),
        member_fk("owner_id"),
        member_fk("link_confirmed_by"),
        member_fk("signature_reviewed_by"),
        one_of("currency", CURRENCIES, "currency_known"),
        one_of("link_method", LINK_METHODS, "link_method_known"),
        CheckConstraint("version >= 1", name="version_positive"),
        CheckConstraint("(order_id IS NULL) = (link_method IS NULL)", name="link_has_method"),
        # a human link names who confirmed it; an exact-ID link is automatic
        CheckConstraint(
            "(coalesce(link_method, '') = 'human') = (link_confirmed_by IS NOT NULL)",
            name="human_link_confirmed",
        ),
    )

    customer_id: Mapped[uuid.UUID] = mapped_column()
    invoice_number: Mapped[str] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(3))
    invoice_date: Mapped[dt.date] = mapped_column(Date)
    owner_id: Mapped[uuid.UUID] = mapped_column()
    version: Mapped[int] = mapped_column(Integer, server_default="1")
    order_id: Mapped[uuid.UUID | None] = mapped_column()
    link_method: Mapped[str | None] = mapped_column(Text)
    link_confirmed_by: Mapped[uuid.UUID | None] = mapped_column()
    signature_reviewed_by: Mapped[uuid.UUID | None] = mapped_column()
    processing: Mapped[bool] = mapped_column(Boolean, server_default=false())
    problem_since: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
    deleted_at: Mapped[dt.datetime | None] = mapped_column(DateTime(timezone=True))
