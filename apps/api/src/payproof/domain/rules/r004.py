"""R-004 — invoice and order use the same currency and units; never converted automatically.
Its PASS is what makes prices and quantities comparable (R-005, R-006)."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import INVOICE_TOTAL, ORDER_TOTAL
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-004"


def comparable(r004_result: CheckResult) -> bool:
    return r004_result.outcome is CheckOutcome.PASS


def r004(s: PackageSnapshot) -> CheckResult:
    order = s.order
    if order is None:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Sifariş təsdiqlənmədən valyuta və vahid müqayisə olunmur.",
                "Currency and units are not compared until the order is confirmed.",
            ),
            cascade=True,
        )
    totals = evidence_for(s, INVOICE_TOTAL, ORDER_TOTAL)
    if order.currency != s.currency:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Faktura {s.currency}, sifariş {order.currency} ilə tərtib olunub. "
                "Valyuta avtomatik çevrilmir — qiymət müqayisəsi dayandırıldı.",
                f"The invoice is in {s.currency}, the order in {order.currency}. "
                "Currency is not converted automatically — price comparison stopped.",
            ),
            totals,
            fix_hint=FixHint.UPLOAD_INVOICE,
        )
    order_units = {line.code: line.unit for line in order.lines}
    # lines missing from the order are R-005's finding; only shared lines are compared here
    shared = [
        (line.code, line.unit, order_units[line.code])
        for line in s.invoice.lines
        if line.code in order_units
    ]
    mismatches = [(c, inv, ord_) for c, inv, ord_ in shared if inv and ord_ and inv != ord_]
    unread = [(c, not inv) for c, inv, ord_ in shared if not inv or not ord_]  # (code, on invoice)
    if mismatches:
        listed = "; ".join(
            f"{code} (faktura: {inv}, sifariş: {ord_})" for code, inv, ord_ in mismatches
        )
        listed_en = "; ".join(
            f"{code} (invoice: {inv}, order: {ord_})" for code, inv, ord_ in mismatches
        )
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Ölçü vahidi fərqlidir: {listed}. "
                "Təsdiqlənmiş çevirmə qaydası olmadığı üçün qiymət müqayisəsi dayandırıldı.",
                f"Units of measure differ: {listed_en}. "
                "There is no confirmed conversion rule, so price comparison stopped.",
            ),
            totals,
            data={"unit_mismatch": [code for code, _, _ in mismatches]},
        )
    if unread:
        # an unread unit is never "units match": prices could be per box vs per piece
        listed = "; ".join(f"{c} ({'faktura' if on_inv else 'sifariş'})" for c, on_inv in unread)
        listed_en = "; ".join(f"{c} ({'invoice' if on_inv else 'order'})" for c, on_inv in unread)
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Ölçü vahidi oxunmadı: {listed}. "
                "Vahid uyğunluğu təsdiqlənmədən qiymət müqayisəsi dayandırıldı.",
                f"Unit of measure not read: {listed_en}. "
                "Price comparison stopped until the units are confirmed.",
            ),
            totals,
            fix_hint=FixHint.EDIT_FIELD,
            data={"unit_unread": [code for code, _ in unread]},
        )
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            f"Valyuta ({s.currency}) və ölçü vahidləri uyğundur.",
            f"Currency ({s.currency}) and units of measure match.",
        ),
        totals,
    )
