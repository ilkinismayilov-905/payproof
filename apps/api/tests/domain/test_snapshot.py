import dataclasses
import uuid
from decimal import Decimal
from typing import Any

import pytest

from payproof.domain.enums import Currency
from payproof.domain.money import Money
from payproof.domain.snapshot import (
    Delivery,
    DeliveryLine,
    EvidenceRef,
    Invoice,
    InvoiceLine,
    Order,
    OrderLine,
    PackageSnapshot,
    Party,
    Rules,
)

AZN = Currency.AZN
C1 = uuid.uuid4()


def azn(v: str) -> Money:
    return Money(v, AZN)


def _snapshot(**over: Any) -> PackageSnapshot:
    """INV-1042 after the PO link (fixtures/packages.json, flow step 2)."""
    fields: dict[str, Any] = {
        "currency": AZN,
        "customer_id": C1,
        "invoice": Invoice(
            po_ref="PO-381",
            po_raw=None,
            unreadable_fields=frozenset(),
            lines=(
                InvoiceLine("GY-1L", Decimal("800"), "ədəd", azn("9.00")),
                InvoiceLine("DY-5", Decimal("400"), "ədəd", azn("12.00")),
            ),
            total=azn("12000.00"),
        ),
        "order": Order(
            po="PO-381",
            customer_id=C1,
            currency=AZN,
            lines=(
                OrderLine("GY-1L", Decimal("800"), "ədəd", azn("9.00")),
                OrderLine("DY-5", Decimal("400"), "ədəd", azn("12.00")),
            ),
        ),
        "candidates": (),
        "delivery": Delivery(
            "TS-5531", "PO-381", C1, (DeliveryLine("GY-1L", Decimal("800")),), True
        ),
        "signature_reviewed": False,
        "rules": Rules(True, True, False, Decimal("0.01")),
        "parties": {C1: Party("B Mağazalar Şəbəkəsi", "1402375611")},
        "evidence": {
            "invoice.po_ref": EvidenceRef(uuid.uuid4(), 1, "Sifariş: PO-381", None),
        },
    }
    fields.update(over)
    return PackageSnapshot(**fields)


def test_valid_snapshot_is_frozen() -> None:
    s = _snapshot()
    assert s.invoice.lines[0].unit_price == azn("9.00")
    with pytest.raises(dataclasses.FrozenInstanceError):
        s.signature_reviewed = True  # type: ignore[misc]


def test_unread_values_are_none() -> None:
    # INV-1047 scan: PO not read, rules give UNKNOWN (never PASS)
    invoice = Invoice(
        None, "PO-3?7", frozenset({"invoice.po_ref"}), (InvoiceLine("X", None, None, None),), None
    )
    _snapshot(invoice=invoice, order=None, candidates=("PO-377", "PO-371"), delivery=None)


def test_invoice_money_in_package_currency() -> None:
    usd_line = InvoiceLine("GY-1L", Decimal("1"), None, Money("9.00", Currency.USD))
    invoice = dataclasses.replace(_snapshot().invoice, lines=(usd_line,))
    with pytest.raises(ValueError, match="currency"):
        _snapshot(invoice=invoice)


def test_order_prices_in_order_currency() -> None:
    order = dataclasses.replace(
        _snapshot().order,  # type: ignore[type-var]
        currency=Currency.USD,
    )
    with pytest.raises(ValueError, match="currency"):
        _snapshot(order=order)


def test_line_codes_are_unique() -> None:
    line = InvoiceLine("GY-1L", Decimal("1"), None, azn("1.00"))
    invoice = dataclasses.replace(_snapshot().invoice, lines=(line, line))
    with pytest.raises(ValueError, match="GY-1L"):
        _snapshot(invoice=invoice)


def test_every_referenced_customer_has_a_party() -> None:
    # R-003 names both buyers (INV-1046: delivery note for another buyer)
    other = uuid.uuid4()
    delivery = dataclasses.replace(_snapshot().delivery, customer_id=other)  # type: ignore[type-var]
    with pytest.raises(ValueError, match=str(other)):
        _snapshot(delivery=delivery)
    s = _snapshot(delivery=delivery, parties={C1: Party("B", "1"), other: Party("C", "2")})
    assert s.parties[other].name == "C"


def test_confirmed_order_has_no_candidates() -> None:
    with pytest.raises(ValueError, match="candidates"):
        _snapshot(candidates=("PO-382",))


@pytest.mark.parametrize("tolerance", ["-0.01", "1.01"])
def test_tolerance_range(tolerance: str) -> None:
    with pytest.raises(ValueError, match="tolerance"):
        Rules(True, True, True, Decimal(tolerance))
