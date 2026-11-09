"""R-003 — invoice, order and delivery note name the same buyer."""

import uuid

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import DELIVERY_CUSTOMER, INVOICE_CUSTOMER, ORDER_CUSTOMER
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-003"


def r003(s: PackageSnapshot) -> CheckResult:
    buyer = s.parties[s.customer_id]
    dl, order = s.delivery, s.order
    other_id: uuid.UUID | None = None
    wrong_dl = False
    if dl is not None and dl.customer_id not in (None, s.customer_id):
        other_id, wrong_dl = dl.customer_id, True
    elif order is not None and order.customer_id != s.customer_id:
        other_id = order.customer_id
    if other_id is not None:
        what, what_en = (
            ("Təhvil sənədi", "The delivery note") if wrong_dl else ("Sifariş", "The order")
        )
        other = s.parties[other_id].name
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                f"{what} başqa alıcıya — {other} — aid ola bilər. Faktura alıcısı: {buyer.name}.",
                f"{what_en} may belong to another buyer — {other}. Invoice buyer: {buyer.name}.",
            ),
            evidence_for(s, INVOICE_CUSTOMER, DELIVERY_CUSTOMER if wrong_dl else ORDER_CUSTOMER),
            fix_hint=FixHint.UPLOAD_DELIVERY if wrong_dl else None,
        )
    if dl is not None and dl.customer_id is None:
        # not in the rules table: an unread buyer must never count as "same buyer" (PASS)
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Təhvil sənədində alıcı oxunmadı — tərəflərin uyğunluğu təsdiqlənmir.",
                "The buyer was not read on the delivery note — the parties are not confirmed "
                "to match.",
            ),
            evidence_for(s, DELIVERY_CUSTOMER),
            fix_hint=FixHint.EDIT_FIELD,
        )
    if order is None:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Sifariş təsdiqlənmədən tərəflər müqayisə olunmur.",
                "The parties are not compared until the order is confirmed.",
            ),
            cascade=True,
        )
    paths = (INVOICE_CUSTOMER, ORDER_CUSTOMER) + ((DELIVERY_CUSTOMER,) if dl else ())
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            f"Alıcı (VÖEN {buyer.voen}) bütün sənədlərdə eynidir.",
            f"The buyer (TIN {buyer.voen}) is the same on all documents.",
        ),
        evidence_for(s, *paths),
    )
