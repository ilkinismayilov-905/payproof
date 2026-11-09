"""The JSON schema Claude answers in (structured output) and its mapping to an
`ExtractionResult`. Source check: a value counts only with a page and a quote; anything
not found, uncited or unparseable stays None — UNKNOWN for the rules, manual entry for a
person. Page numbers are checked against the file later by `validate()`."""

import datetime as dt
import re
import uuid
from decimal import Decimal, InvalidOperation

from pydantic import BaseModel, ConfigDict

from payproof.domain.enums import Currency
from payproof.domain.rules.paths import (
    DELIVERY_CUSTOMER,
    DELIVERY_PO,
    DELIVERY_SIGNATURE,
    INVOICE_PO,
    INVOICE_TOTAL,
    line,
)
from payproof.extraction.base import (
    DeliveryData,
    Evidence,
    ExtractionResult,
    InvoiceData,
    LineData,
)

_PO = re.compile(r"PO-\d{3,}")
_QUOTE = 300  # evidence quote length cap


class _Strict(BaseModel):
    model_config = ConfigDict(extra="forbid")  # → additionalProperties: false


class Cited(_Strict):
    value: str | None
    page: int | None  # 1-based page of the file
    quote: str | None  # the printed text the value was read from


class CitedFlag(_Strict):
    value: bool | None
    page: int | None
    quote: str | None


class InvoiceLineOut(_Strict):
    product_code: str
    qty: Cited
    unit: str | None
    unit_price: Cited


class InvoiceOut(_Strict):
    po_number: Cited
    currency: str | None
    total: Cited
    lines: list[InvoiceLineOut]


class DeliveryLineOut(_Strict):
    product_code: str
    qty: Cited


class DeliveryOut(_Strict):
    note_number: str | None
    po_number: Cited
    customer_voen: Cited
    signed: CitedFlag
    delivery_date: str | None  # YYYY-MM-DD
    lines: list[DeliveryLineOut]


class _Reader:
    def __init__(self) -> None:
        self.evidence: list[Evidence] = []
        self.unread: set[str] = set()

    def get(self, path: str, c: Cited | CitedFlag) -> str | bool | None:
        if c.value is None or c.page is None or not (c.quote or "").strip():
            self.unread.add(path)
            return None
        self.evidence.append(Evidence(path, c.page, (c.quote or "").strip()[:_QUOTE]))
        return c.value

    def number(self, path: str, c: Cited) -> Decimal | None:
        text = self.get(path, c)
        try:
            value = Decimal(str(text).replace(" ", "")) if isinstance(text, str) else None
        except InvalidOperation:
            value = None
        if value is None or not value.is_finite():
            self.unread.add(path)
            self.evidence = [e for e in self.evidence if e.field_path != path]
            return None
        return value


def _invoice(out: InvoiceOut) -> ExtractionResult:
    r = _Reader()
    printed = r.get(INVOICE_PO, out.po_number)
    po = printed.strip().upper() if isinstance(printed, str) else None
    if po is not None and not _PO.fullmatch(po):
        r.unread.add(INVOICE_PO)
    lines = tuple(
        LineData(
            p,
            r.number(line("invoice", p, "qty"), li.qty),
            li.unit,
            r.number(line("invoice", p, "unit_price"), li.unit_price),
        )
        for li in out.lines
        if (p := li.product_code.strip())
    )
    inv = InvoiceData(
        po_ref=po if INVOICE_PO not in r.unread else None,
        po_raw=printed if isinstance(printed, str) and INVOICE_PO in r.unread else None,
        currency=out.currency if out.currency in set(Currency) else None,
        total=r.number(INVOICE_TOTAL, out.total),
        lines=lines,
        unreadable=frozenset(r.unread - {INVOICE_TOTAL}),  # no editable total field
    )
    return ExtractionResult("llm", invoice=inv, evidence=tuple(r.evidence))


def _date(text: str | None) -> dt.date | None:
    try:
        return dt.date.fromisoformat(text) if text else None
    except ValueError:
        return None


def _delivery(out: DeliveryOut, customer_id: uuid.UUID, customer: str) -> ExtractionResult:
    r = _Reader()
    po = r.get(DELIVERY_PO, out.po_number)
    voen = r.get(DELIVERY_CUSTOMER, out.customer_voen)
    signed = r.get(DELIVERY_SIGNATURE, out.signed)
    digits = re.sub(r"\D", "", voen) if isinstance(voen, str) else ""
    d = DeliveryData(
        note_number=out.note_number,
        po_ref=po.strip().upper() if isinstance(po, str) else None,
        # the model never sees ids: the note names our customer only if the VÖEN matches
        customer_id=customer_id if digits and digits in re.sub(r"\D", "", customer) else None,
        signed=signed if isinstance(signed, bool) else None,
        delivery_date=_date(out.delivery_date),
        lines=tuple(
            LineData(p, r.number(line("delivery", p, "qty"), li.qty), None)
            for li in out.lines
            if (p := li.product_code.strip())
        ),
    )
    return ExtractionResult("llm", delivery=d, evidence=tuple(r.evidence))


def to_result(
    out: InvoiceOut | DeliveryOut, customer_id: uuid.UUID, customer: str
) -> ExtractionResult:
    if isinstance(out, InvoiceOut):
        return _invoice(out)
    return _delivery(out, customer_id, customer)
