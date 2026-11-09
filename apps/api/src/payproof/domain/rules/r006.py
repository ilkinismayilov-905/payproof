"""R-006 — invoiced quantities equal the order's and, when the delivery note belongs to this
order and buyer, the delivered quantities. Partial delivery is not auto-accepted in P0."""

from decimal import Decimal

from payproof.domain.enums import CheckOutcome
from payproof.domain.format import format_qty
from payproof.domain.rules.paths import line
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for, no_lines
from payproof.domain.snapshot import PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-006"


def r006(s: PackageSnapshot, *, comparable: bool) -> CheckResult:
    """`comparable` is R-004's PASS (same currency and units)."""
    order, dl = s.order, s.delivery
    if not comparable or order is None:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Miqdar müqayisəsi sifariş və vahid uyğunluğu təsdiqləndikdən sonra aparılır.",
                "Quantities are compared once the order and units are confirmed.",
            ),
            cascade=True,
        )
    if empty := no_lines(RULE, s):
        return empty
    linked = dl is not None and dl.po_ref == order.po and dl.customer_id == s.customer_id
    ordered = {ol.code: ol for ol in order.lines}
    delivered: dict[str, Decimal | None] = {dl_.code: dl_.qty for dl_ in dl.lines} if dl else {}
    invoice_codes = [li.code for li in s.invoice.lines]
    # (code, document) of every quantity that was not read
    unread = [(li.code, "invoice") for li in s.invoice.lines if li.qty is None]
    if linked:
        unread += [
            (c, "delivery") for c in invoice_codes if c in delivered and delivered[c] is None
        ]
    if unread:
        # not in the rules table: an unread quantity is never "quantities match"
        codes = ", ".join(dict.fromkeys(code for code, _ in unread))
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Miqdar oxunmadı: {codes}. Mənbəyə baxıb sahəni təsdiqləyin.",
                f"Quantity not read: {codes}. Check the source and confirm the field.",
            ),
            evidence_for(s, *(line(doc, code, "qty") for code, doc in unread)),
            fix_hint=FixHint.EDIT_FIELD,
        )
    # (code, invoiced, doc, other qty, unit)
    found: list[tuple[str, Decimal, str, Decimal, str | None]] = []
    for li in s.invoice.lines:
        qty, ol = li.qty or Decimal(0), ordered.get(li.code)
        unit = li.unit or (ol.unit if ol else None)
        if ol is not None and ol.qty != qty:
            found.append((li.code, qty, "order", ol.qty, unit))
        got = delivered.get(li.code) or Decimal(0)  # a missing delivery line counts as 0
        if linked and got != qty:
            found.append((li.code, qty, "delivery", got, unit))
    where = {"order": "sifarişdə", "delivery": "təhvil aktında"}
    where_en = {"order": "order", "delivery": "delivery note"}
    problems = "; ".join(
        f"{code}: fakturada {format_qty(q)}, {where[doc]} {format_qty(other)}"
        + (f" {u}" if u else "")
        for code, q, doc, other, u in found
    )
    problems_en = "; ".join(
        f"{code}: invoice {format_qty(q, en=True)}, {where_en[doc]} {format_qty(other, en=True)}"
        + (f" {u}" if u else "")
        for code, q, doc, other, u in found
    )
    paths = [
        p
        for code, _, doc, _, _ in found
        for p in (line("invoice", code, "qty"), line(doc, code, "qty"))
    ]
    if problems:
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                f"{problems}. Qismən çatdırılma P0-da avtomatik uyğun sayılmır.",
                f"{problems_en}. Partial delivery is not accepted automatically in P0.",
            ),
            evidence_for(s, *paths),
            fix_hint=FixHint.UPLOAD_INVOICE,
        )
    first = invoice_codes[0]
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            "Sifariş, faktura və təhvil miqdarları uyğundur.",
            "Order, invoice and delivery quantities match.",
        )
        if linked
        else Msg(
            "Faktura və sifariş miqdarları uyğundur; uyğun təhvil sənədi olmadığı üçün "
            "təhvil miqdarı müqayisə edilmədi.",
            "Invoice and order quantities match; there is no matching delivery note, "
            "so delivered quantities were not compared.",
        ),
        evidence_for(
            s, line("invoice", first, "qty"), *([line("delivery", first, "qty")] if linked else [])
        ),
    )
