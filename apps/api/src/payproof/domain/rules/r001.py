"""R-001 — the invoice carries the PO number when the customer requires it."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import INVOICE_PO
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-001"


def po_unread(s: PackageSnapshot) -> bool:
    return INVOICE_PO in s.invoice.unreadable_fields


def r001(s: PackageSnapshot) -> CheckResult:
    po = s.invoice.po_ref
    ev = evidence_for(s, INVOICE_PO)
    if not s.rules.require_po:
        return CheckResult(
            RULE,
            CheckOutcome.NOT_APPLICABLE,
            Msg(
                "Müştəri qaydası sifariş nömrəsini tələb etmir.",
                "The customer rule does not require an order number.",
            ),
        )
    if po_unread(s):
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "PO sahəsi skanda oxunmadı. Mənbəyə baxıb sahəni təsdiqləyin "
                "və ya müştəridən aydın nüsxə istəyin.",
                "The PO field was not read on the scan. Check the source and confirm the field "
                "or ask the customer for a clear copy.",
            ),
            ev,
            fix_hint=FixHint.EDIT_FIELD,
        )
    if not po:
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                "Müştəri qaydası fakturada sifariş nömrəsi tələb edir, "
                "fakturada isə PO göstərilməyib.",
                "The customer rule requires an order number on the invoice, "
                "but the invoice shows no PO.",
            ),
            ev,
            fix_hint=FixHint.UPLOAD_INVOICE,
        )
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(f"Fakturada sifariş nömrəsi var: {po}.", f"The invoice has an order number: {po}."),
        ev,
    )
