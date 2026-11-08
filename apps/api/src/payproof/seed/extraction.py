"""Extraction results of each package's current invoice and delivery versions."""

import datetime as dt
from collections.abc import Sequence
from decimal import Decimal

from payproof.repositories.models import (
    DeliveryNote,
    DeliveryNoteLine,
    ExtractedField,
    ExtractedInvoice,
    ExtractedInvoiceLine,
)
from payproof.repositories.orm import Base
from payproof.seed.fixtures import PACKAGES, UNITS, Fixture, uid
from payproof.seed.identity import COMPANY_ID
from payproof.seed.packages import version_id


def _latest(p: Fixture, doc_type: str) -> int | None:
    doc = next((d for d in p["documents"] if d["type"] == doc_type), None)
    return max(v["version_no"] for v in doc["versions"]) if doc else None


def _invoice(p: Fixture, no: int) -> list[Base]:
    pid, inv = p["id"], p["invoice"]
    vid, eid = version_id(pid, "invoice", no), uid(f"{pid}:extracted_invoice")
    head = ExtractedInvoice(
        id=eid,
        company_id=COMPANY_ID,
        document_version_id=vid,
        po_ref=inv["po_ref"],
        po_raw=inv["po_raw"],
        total=Decimal(inv["total"]),
        currency=p["currency"],
    )
    lines = [
        ExtractedInvoiceLine(
            id=uid(f"{pid}:invoice_line:{li['product_code']}"),
            company_id=COMPANY_ID,
            extracted_invoice_id=eid,
            product_code=li["product_code"],
            qty=Decimal(str(li["qty"])),
            unit=UNITS[li["product_code"]],
            unit_price=Decimal(li["unit_price"]),
        )
        for li in inv["lines"]
    ]
    # unread critical fields wait for a person (INV-1047: PO not read on the scan)
    unread = [
        ExtractedField(
            id=uid(f"{pid}:field:{f}"),
            company_id=COMPANY_ID,
            document_version_id=vid,
            field_path=f"invoice.{f}",
            raw_value=inv["po_raw"] if f == "po_ref" else None,
            review_status="REVIEW_REQUIRED",
        )
        for f in inv["unreadable_fields"]
    ]
    return [head, *lines, *unread]


def _delivery(p: Fixture, d: Fixture, no: int) -> list[Base]:
    pid, nid = p["id"], uid(f"{p['id']}:delivery_note")
    note = DeliveryNote(
        id=nid,
        company_id=COMPANY_ID,
        document_version_id=version_id(pid, "delivery", no),
        note_number=d["note_number"],
        po_ref=d["po_ref"],
        customer_id=uid(d["customer_id"]) if d["customer_id"] else None,
        signed=d["signed"],
        delivery_date=dt.date.fromisoformat(d["delivery_date"]) if d["delivery_date"] else None,
    )
    lines = [
        DeliveryNoteLine(
            id=uid(f"{pid}:delivery_line:{li['product_code']}"),
            company_id=COMPANY_ID,
            delivery_note_id=nid,
            product_code=li["product_code"],
            qty=Decimal(str(li["qty"])),
        )
        for li in d["lines"]
    ]
    return [note, *lines]


def extraction_rows() -> list[Sequence[Base]]:
    """Heads before lines, so one flush per group satisfies the FKs."""
    heads: list[Base] = []
    for p in PACKAGES.values():
        if p["processing"]:
            continue  # extraction not finished yet
        if (no := _latest(p, "invoice")) is not None:
            heads += _invoice(p, no)
        if p["delivery"] and (no := _latest(p, "delivery")) is not None:
            heads += _delivery(p, p["delivery"], no)
    first = [r for r in heads if isinstance(r, ExtractedInvoice | DeliveryNote)]
    return [first, [r for r in heads if r not in first]]
