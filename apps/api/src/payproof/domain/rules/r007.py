"""R-007 — the delivery note is in the package and refers to the confirmed order."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import DELIVERY_PO, ORDER_PO
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-007"


def r007(s: PackageSnapshot) -> CheckResult:
    dl, order = s.delivery, s.order
    if not s.rules.require_delivery:
        return CheckResult(
            RULE,
            CheckOutcome.NOT_APPLICABLE,
            Msg(
                "Müştəri qaydası təhvil sənədi tələb etmir.",
                "The customer rule does not require a delivery note.",
            ),
        )
    if dl is None:
        signed, signed_en = ("imzalanmış ", "signed ") if s.rules.require_signature else ("", "")
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                f"Müştəri qaydası {signed}təhvil sənədi tələb edir; paketdə təhvil sənədi yoxdur.",
                f"The customer rule requires a {signed_en}delivery note; "
                "the package has no delivery note.",
            ),
            fix_hint=FixHint.UPLOAD_DELIVERY,
        )
    if order is None:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Sifariş təsdiqlənmədən təhvil sənədinin bağlılığı yoxlanmır.",
                "The delivery note link is not checked until the order is confirmed.",
            ),
            cascade=True,
        )
    note, note_en = dl.no or "Təhvil", dl.no or "the delivery note"
    if dl.po_ref is None:
        # not in the rules table: an unread PO on the note is never "linked"
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"{note} sənədində sifariş nömrəsi oxunmadı. Uyğunluq təsdiqlənməyib.",
                f"The order number was not read on {note_en}. The match is not confirmed.",
            ),
            evidence_for(s, DELIVERY_PO),
            fix_hint=FixHint.EDIT_FIELD,
        )
    if dl.po_ref != order.po:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"{note} sənədində sifariş: {dl.po_ref}; təsdiqlənmiş sifariş: {order.po}. "
                "Uyğunluq təsdiqlənməyib.",
                f"Order on {note_en}: {dl.po_ref}; confirmed order: {order.po}. "
                "The match is not confirmed.",
            ),
            evidence_for(s, DELIVERY_PO, ORDER_PO),
            fix_hint=FixHint.UPLOAD_DELIVERY,
        )
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            f"{note} paketdədir və {order.po} sifarişinə bağlıdır.",
            f"{dl.no or 'The delivery note'} is in the package and linked to order {order.po}.",
        ),
        evidence_for(s, DELIVERY_PO),
    )
