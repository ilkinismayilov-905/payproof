"""`AI_PROVIDER=mock` (default): pre-made results from fixtures/samples.json by file name —
the package's current extraction with the sample's correction applied. The UI labels it as a
pre-made result ("əvvəlcədən hazırlanmış nəticə"). A scan without a sample leaves the PO unread."""

from dataclasses import replace
from decimal import Decimal
from functools import cache
from typing import Any

from payproof.domain.enums import Currency
from payproof.domain.format import format_money, format_qty
from payproof.domain.money import Money
from payproof.domain.rules.paths import (
    INVOICE_CUSTOMER,
    INVOICE_PO,
    INVOICE_TOTAL,
    line,
)
from payproof.extraction.base import (
    Evidence,
    ExtractionInput,
    ExtractionResult,
    InvoiceData,
    LineData,
)
from payproof.seed.fixtures import load

UNREAD = "oxunmur"


@cache
def _samples() -> dict[tuple[str, str], dict[str, Any]]:
    return {(s["file_name"], s["type"]): s["extraction"] for s in load("samples.json")}


def _price(value: Decimal | None, currency: str | None) -> str:
    if value is None:
        return UNREAD
    return format_money(Money(value, Currency(currency))) if currency else f"{value:.2f}"


def _qty(li: LineData) -> str:
    return f"{format_qty(li.qty) if li.qty is not None else UNREAD} {li.unit or UNREAD}"


def _invoice_evidence(inv: InvoiceData, customer: str) -> list[Evidence]:
    po = f"{inv.po_raw or '?'} ({UNREAD})" if INVOICE_PO in inv.unreadable else inv.po_ref
    out = [
        Evidence(INVOICE_PO, 1, f"Sifariş №: {po or '—'}"),
        Evidence(INVOICE_CUSTOMER, 1, f"Alıcı: {customer}"),
        Evidence(INVOICE_TOTAL, 1, f"Yekun: {_price(inv.total, inv.currency)}"),
    ]
    for li in inv.lines:
        quote = f"{li.product_code} — {_qty(li)} × {_price(li.unit_price, inv.currency)}"
        out += [
            Evidence(line("invoice", li.product_code, "qty"), 1, quote),
            Evidence(line("invoice", li.product_code, "unit_price"), 1, quote),
        ]
    return out


def _corrected_invoice(inv: InvoiceData, x: dict[str, Any]) -> InvoiceData:
    lines = list(inv.lines)
    if fix := x.get("line"):
        lines = [
            replace(
                li,
                qty=Decimal(str(fix["qty"])) if "qty" in fix else li.qty,
                unit_price=Decimal(fix["unit_price"]) if "unit_price" in fix else li.unit_price,
            )
            if li.product_code == fix["product_code"]
            else li
            for li in lines
        ]
    known = all(li.qty is not None and li.unit_price is not None for li in lines)
    total = sum(
        ((li.qty or Decimal(0)) * (li.unit_price or Decimal(0)) for li in lines), Decimal(0)
    )
    return InvoiceData(
        po_ref=x.get("po_ref", inv.po_ref),
        po_raw=None,
        currency=x.get("currency", inv.currency),
        total=total.quantize(Decimal("0.01")) if known else None,
        lines=tuple(lines),
    )  # a corrected file is read in full: nothing left for review


class MockExtractionAdapter:
    async def extract(self, src: ExtractionInput) -> ExtractionResult:
        x = _samples().get((src.file_name, src.doc_type))
        if src.doc_type == "invoice" and src.invoice:
            inv = src.invoice
            if x is not None:
                inv = _corrected_invoice(inv, x)
            elif src.scanned:
                inv = replace(inv, po_ref=None, po_raw=None, unreadable=frozenset({INVOICE_PO}))
            return ExtractionResult(
                "mock", invoice=inv, evidence=tuple(_invoice_evidence(inv, src.customer))
            )
        return ExtractionResult("mock", warnings=("no pre-made result for this file",))
