"""R-002 — the invoice PO matches the confirmed order. A suggested link is never enough."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import INVOICE_PO, ORDER_PO
from payproof.domain.rules.r001 import po_unread
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-002"


def r002(s: PackageSnapshot) -> CheckResult:
    po, order = s.invoice.po_ref, s.order
    if order is None:
        n = len(s.candidates)
        message = (
            Msg(
                f"{n} mümkün sifariş tapıldı — düzgün sifarişi insan seçməlidir.",
                f"{n} possible orders found — a person must choose the right one.",
            )
            if n > 1
            else Msg(
                "Təklif olunan sifariş əlaqəsi hələ insan tərəfindən təsdiqlənməyib.",
                "The suggested order link has not been confirmed by a person yet.",
            )
        )
        return CheckResult(RULE, CheckOutcome.UNKNOWN, message, fix_hint=FixHint.LINK_ORDER)
    if po_unread(s):
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Fakturadakı PO oxunmadığı üçün müqayisə aparılmır.",
                "The invoice PO was not read, so no comparison is made.",
            ),
            cascade=True,
        )
    if not po:
        return CheckResult(
            RULE,
            CheckOutcome.NOT_APPLICABLE,
            Msg("Fakturada PO yoxdur — R-001-ə baxın.", "The invoice has no PO — see R-001."),
        )
    ev = evidence_for(s, INVOICE_PO, ORDER_PO)
    if po != order.po:
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                f"Fakturadakı {po} təsdiqlənmiş sifarişə ({order.po}) uyğun deyil.",
                f"{po} on the invoice does not match the confirmed order ({order.po}).",
            ),
            ev,
            fix_hint=FixHint.UPLOAD_INVOICE,
        )
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(f"{po} təsdiqlənmiş sifarişə uyğundur.", f"{po} matches the confirmed order."),
        ev,
    )
