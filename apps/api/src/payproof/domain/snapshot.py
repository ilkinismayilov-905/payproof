"""Rule-engine input (docs/architecture/rules-engine.md): plain data, built from the DB by a
service and never from ORM objects inside rules. `None` means "not read" -> rules give UNKNOWN."""

import uuid
from dataclasses import dataclass
from decimal import Decimal

from payproof.domain.enums import Currency
from payproof.domain.money import Money


@dataclass(frozen=True)
class EvidenceRef:
    """Where a value was read: document version, page and quote (bbox: normalised x, y, w, h)."""

    document_version_id: uuid.UUID
    page: int
    quote: str
    bbox: tuple[float, float, float, float] | None


@dataclass(frozen=True)
class InvoiceLine:
    code: str
    qty: Decimal | None
    unit: str | None
    unit_price: Money | None


@dataclass(frozen=True)
class Invoice:
    po_ref: str | None  # normalised "PO-381"
    po_raw: str | None  # as printed when it could not be normalised ("PO-3?7")
    unreadable_fields: frozenset[str]  # field paths, e.g. "invoice.po_ref"
    lines: tuple[InvoiceLine, ...]
    total: Money | None


@dataclass(frozen=True)
class OrderLine:
    code: str
    qty: Decimal
    unit: str | None
    unit_price: Money


@dataclass(frozen=True)
class Order:
    """Present only when the link is confirmed (human or exact PO id)."""

    po: str
    customer_id: uuid.UUID
    currency: Currency
    lines: tuple[OrderLine, ...]


@dataclass(frozen=True)
class DeliveryLine:
    code: str
    qty: Decimal | None


@dataclass(frozen=True)
class Delivery:
    no: str | None
    po_ref: str | None
    customer_id: uuid.UUID | None
    lines: tuple[DeliveryLine, ...]
    signed: bool | None


@dataclass(frozen=True)
class Rules:
    """The customer's rule set version in force for this evaluation."""

    require_po: bool
    require_delivery: bool
    require_signature: bool
    tolerance: Decimal  # R-009, in the invoice currency

    def __post_init__(self) -> None:
        if not Decimal(0) <= self.tolerance <= Decimal(1):
            raise ValueError(f"tolerance must be 0.00-1.00, got {self.tolerance}")
