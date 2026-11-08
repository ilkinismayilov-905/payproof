"""DB -> PackageSnapshot for one package: the rule engine's input (rules-engine.md), built from
the current invoice/delivery extraction, the confirmed order and the rule set in force."""

import uuid
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.domain.enums import Currency
from payproof.domain.money import Money
from payproof.domain.snapshot import (
    Delivery,
    DeliveryLine,
    Invoice,
    InvoiceLine,
    Order,
    OrderLine,
    PackageSnapshot,
    Party,
    Rules,
)
from payproof.repositories import package_reads as reads
from payproof.repositories.models import (
    Customer,
    DeliveryNote,
    DeliveryNoteLine,
    Document,
    DocumentVersion,
    ExtractedInvoiceLine,
    RequirementSet,
)
from payproof.repositories.models import Order as OrderRow
from payproof.repositories.models import (
    OrderLine as OrderLineRow,
)
from payproof.services.package_query import PackageState


async def build_snapshot(session: AsyncSession, state: PackageState) -> PackageSnapshot | None:
    """None while processing or before the invoice is extracted (nothing to evaluate yet)."""
    p = state.package
    invoices, unread = await reads.invoices(session, [p.id])
    inv = invoices.get(p.id)
    if p.processing or inv is None or p.currency is None or state.rule_set_id is None:
        return None
    currency = Currency(p.currency)
    lines = (
        await session.scalars(
            select(ExtractedInvoiceLine).where(ExtractedInvoiceLine.extracted_invoice_id == inv.id)
        )
    ).all()
    invoice = Invoice(
        po_ref=inv.po_ref,
        po_raw=inv.po_raw,
        unreadable_fields=frozenset(path for vid, path in unread if vid == inv.document_version_id),
        lines=tuple(
            InvoiceLine(li.product_code, li.qty, li.unit, _money(li.unit_price, currency))
            for li in lines
        ),
        total=_money(inv.total, currency),
    )
    order = await _order(session, p.order_id) if p.order_id else None
    delivery = await _delivery(session, p.id)
    rs = await session.get(RequirementSet, state.rule_set_id)
    assert rs is not None  # noqa: S101 — FK: the rule set in force exists
    referenced = {p.customer_id} | {x.customer_id for x in (order, delivery) if x and x.customer_id}
    parties = await session.execute(
        select(Customer.id, Customer.name, Customer.voen).where(Customer.id.in_(referenced))
    )
    return PackageSnapshot(
        currency=currency,
        customer_id=p.customer_id,
        invoice=invoice,
        order=order,
        candidates=(),  # shortcut: suggested orders come with matching (B-16)
        delivery=delivery,
        signature_reviewed=p.signature_reviewed_by is not None,
        rules=Rules(rs.require_po, rs.require_delivery, rs.require_signature, rs.tolerance),
        parties={cid: Party(name, voen) for cid, name, voen in parties.all()},
    )


def _money(value: Decimal | None, currency: Currency) -> Money | None:
    return None if value is None else Money(value, currency)


async def _order(session: AsyncSession, order_id: uuid.UUID) -> Order | None:
    o = await session.get(OrderRow, order_id)
    if o is None:
        return None
    currency = Currency(o.currency)
    lines = (await session.scalars(select(OrderLineRow).where(OrderLineRow.order_id == o.id))).all()
    return Order(
        po=o.po_number,
        customer_id=o.customer_id,
        currency=currency,
        lines=tuple(
            OrderLine(li.product_code, li.qty, li.unit, Money(li.unit_price, currency))
            for li in lines
        ),
    )


async def _delivery(session: AsyncSession, package_id: uuid.UUID) -> Delivery | None:
    q = (
        select(DocumentVersion.version_no, DeliveryNote)
        .join(DocumentVersion, DocumentVersion.id == DeliveryNote.document_version_id)
        .join(Document, Document.id == DocumentVersion.document_id)
        .where(Document.package_id == package_id)
        .order_by(DocumentVersion.version_no.desc())
        .limit(1)
    )
    row = (await session.execute(q)).first()
    if row is None:
        return None
    note = row[1]
    lines = (
        await session.scalars(
            select(DeliveryNoteLine).where(DeliveryNoteLine.delivery_note_id == note.id)
        )
    ).all()
    return Delivery(
        no=note.note_number,
        po_ref=note.po_ref,
        customer_id=note.customer_id,
        lines=tuple(DeliveryLine(li.product_code, li.qty) for li in lines),
        signed=note.signed,
    )
