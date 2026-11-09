import uuid
from decimal import Decimal

import pytest
from pydantic import ValidationError

from payproof.extraction.llm_schema import InvoiceOut, to_result

CUSTOMER = uuid.uuid4()


def _ref(value: object, page: int | None = 1, quote: str | None = "x") -> dict[str, object]:
    return {"value": value, "page": page, "quote": quote}


def _invoice(**over: object) -> InvoiceOut:
    raw: dict[str, object] = {
        "po_number": _ref("PO-381", 1, "Sifariş №: PO-381"),
        "currency": "AZN",
        "total": _ref("1200.00", 2, "Yekun: 1.200,00"),
        "lines": [
            {
                "product_code": "KY-10",
                "qty": _ref("12", 1, "KY-10 12 kg"),
                "unit": "kg",
                "unit_price": _ref("100.00", 1, "KY-10 12 kg 100,00"),
            }
        ],
    }
    return InvoiceOut.model_validate(raw | over)


def test_cited_values_are_kept_with_their_pages() -> None:
    r = to_result(_invoice(), CUSTOMER, "A MMC, VÖEN 1234567890")
    assert r.invoice is not None and not r.needs_review
    assert (r.invoice.po_ref, r.invoice.total) == ("PO-381", Decimal("1200.00"))
    assert r.invoice.lines[0].qty == Decimal(12)
    pages = {e.field_path: e.page for e in r.evidence}
    assert pages == {
        "invoice.po_ref": 1,
        "invoice.total": 2,
        "invoice.lines[KY-10].qty": 1,
        "invoice.lines[KY-10].unit_price": 1,
    }


def test_value_without_a_source_is_unknown() -> None:
    r = to_result(_invoice(po_number=_ref("PO-381", None, None)), CUSTOMER, "A")
    assert r.invoice is not None and r.invoice.po_ref is None
    assert "invoice.po_ref" in r.invoice.unreadable and r.needs_review
    assert "invoice.po_ref" not in {e.field_path for e in r.evidence}


def test_not_found_and_garbled_values_are_unknown() -> None:
    line = {"product_code": "KY-10", "qty": _ref(None), "unit": None, "unit_price": _ref("1,2x")}
    r = to_result(_invoice(po_number=_ref("PO 38l"), lines=[line]), CUSTOMER, "A")
    assert r.invoice is not None
    assert (r.invoice.po_ref, r.invoice.po_raw) == (None, "PO 38l")
    assert r.invoice.lines[0].qty is None and r.invoice.lines[0].unit_price is None
    assert {"invoice.lines[KY-10].qty", "invoice.lines[KY-10].unit_price"} <= r.invoice.unreadable


def test_unsupported_currency_is_dropped() -> None:
    r = to_result(_invoice(currency="EUR"), CUSTOMER, "A")
    assert r.invoice is not None and r.invoice.currency is None


def test_schema_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        _invoice(all_checks_passed=True)
