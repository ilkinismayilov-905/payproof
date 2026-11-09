"""R-005 — invoice unit prices equal the order's; the difference is reported, never judged."""

from payproof.domain.enums import CheckOutcome
from payproof.domain.format import format_money, format_qty
from payproof.domain.money import Money
from payproof.domain.rules.paths import line
from payproof.domain.rules.result import CheckResult, FixHint, evidence_for, no_lines
from payproof.domain.snapshot import InvoiceLine, PackageSnapshot
from payproof.domain.text import Msg

RULE = "R-005"


def _unread_path(li: InvoiceLine) -> str:
    return line("invoice", li.code, "qty" if li.qty is None else "unit_price")


def r005(s: PackageSnapshot, *, comparable: bool) -> CheckResult:
    """`comparable` is R-004's PASS (same currency and units)."""
    order = s.order
    if not comparable or order is None:
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                "Valyuta və vahid uyğunluğu təsdiqlənmədən qiymət müqayisə edilmir.",
                "Prices are not compared until currency and units are confirmed.",
            ),
            cascade=True,
        )
    if empty := no_lines(RULE, s):
        return empty
    prices = {ol.code: ol.unit_price for ol in order.lines}
    lines = s.invoice.lines
    if missing := [li.code for li in lines if li.code not in prices]:
        codes = ", ".join(missing)
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Sifarişdə olmayan sətir: {codes}. Avtomatik uyğun sayılmır.",
                f"Line not on the order: {codes}. It is not accepted automatically.",
            ),
            evidence_for(s, *(line("invoice", c, "unit_price") for c in missing)),
        )
    read = [
        (li.code, price, qty)
        for li in lines
        if (price := li.unit_price) is not None and (qty := li.qty) is not None
    ]
    if unread := [li.code for li in lines if li.code not in {code for code, _, _ in read}]:
        # not in the rules table: a difference cannot be computed, so this is never PASS
        codes = ", ".join(unread)
        return CheckResult(
            RULE,
            CheckOutcome.UNKNOWN,
            Msg(
                f"Vahid qiymət və ya miqdar oxunmadı: {codes}. Mənbəyə baxıb sahəni təsdiqləyin.",
                f"Unit price or quantity not read: {codes}. "
                "Check the source and confirm the field.",
            ),
            evidence_for(s, *(_unread_path(li) for li in lines if li.code in unread)),
            fix_hint=FixHint.EDIT_FIELD,
        )
    parts: list[str] = []
    parts_en: list[str] = []
    diffs: list[Money] = []
    paths: list[str] = []
    for code, price, qty in read:
        ordered = prices[code]
        if price == ordered:
            continue
        diff = (price - ordered) * qty
        diffs.append(diff)
        parts.append(
            f"{code}: fakturada {format_money(price)}, sifarişdə "
            f"{format_money(ordered)} × {format_qty(qty)} = {format_money(diff)} fərq"
        )
        parts_en.append(
            f"{code}: {format_money(price, en=True)} on the invoice, "
            f"{format_money(ordered, en=True)} on the order × {format_qty(qty, en=True)} "
            f"= {format_money(diff, en=True)} difference"
        )
        paths += [line("invoice", code, "unit_price"), line("order", code, "unit_price")]
    if diffs:
        total = Money.sum(diffs, s.currency)
        return CheckResult(
            RULE,
            CheckOutcome.FAIL,
            Msg(
                "; ".join(parts)
                + ". Aktual qiymət əlavəsini yoxlayın. Fərq itki və ya gəlir sayılmır.",
                "; ".join(parts_en) + ". Check the current price addendum. "
                "The difference is not counted as a loss or a gain.",
            ),
            evidence_for(s, *paths),
            fix_hint=FixHint.UPLOAD_INVOICE,
            data={"line_difference": {"amount": str(total), "currency": str(total.currency)}},
        )
    first, n = lines[0].code, len(lines)
    return CheckResult(
        RULE,
        CheckOutcome.PASS,
        Msg(
            f"{n} sətirdə vahid qiymət sifarişlə eynidir.",
            f"Unit prices match the order on {n} line{'' if n == 1 else 's'}.",
        ),
        evidence_for(s, line("invoice", first, "unit_price"), line("order", first, "unit_price")),
    )
