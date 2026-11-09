"""R-008 — the delivery note is signed, confirmed visually by a person (not legal proof)."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.rules.paths import DELIVERY_SIGNATURE
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-008"


def r008(s: PackageSnapshot, *, r007_result: CheckResult) -> CheckResult:
    dl = s.delivery
    if not s.rules.require_signature:
        return CheckResult(
            RULE,
            CheckOutcome.NOT_APPLICABLE,
            Msg(
                "Müştəri qaydası imza tələb etmir.",
                "The customer rule does not require a signature.",
            ),
        )
    if dl is None:
        return CheckResult(
            RULE,
            CheckOutcome.NOT_APPLICABLE,
            Msg(
                "Təhvil sənədi olmadan imza yoxlanmır — R-007-yə baxın.",
                "The signature is not checked without a delivery note — see R-007.",
            ),
        )
    if r007_result.outcome is not CheckOutcome.PASS:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Təhvil sənədinin uyğunluğu təsdiqlənmədən imza yoxlanmır.",
                "The signature is not checked until the delivery note is confirmed.",
            ),
            cascade=True,
        )
    ev = evidence_for(s, DELIVERY_SIGNATURE)
    if dl.signed is False:  # None = not read: a person decides, like a present signature
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                "Təhvil aktında qəbul edənin imza sahəsi boşdur.",
                "The receiver's signature field on the delivery note is empty.",
            ),
            ev,
            fix_hint=FixHint.UPLOAD_DELIVERY,
        )
    if not s.signature_reviewed:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "İmza tələb olunur: əməkdaş sənədə baxıb imzanın mövcudluğunu təsdiqləməlidir.",
                "A signature is required: a staff member must look at the document "
                "and confirm the signature is present.",
            ),
            ev,
            fix_hint=FixHint.REVIEW_SIGNATURE,
        )
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            "Əməkdaş imzanın vizual mövcudluğunu təsdiqləyib. "
            "Bu, imzanın hüquqi autentifikasiyası deyil.",
            "A staff member confirmed the signature is visually present. "
            "This is not legal authentication of the signature.",
        ),
        ev,
    )
