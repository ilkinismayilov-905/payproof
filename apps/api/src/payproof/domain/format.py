"""az-AZ display for rule messages; same output as api-client formatMoney / formatQuantity.
`en=True` groups the en-GB way (`12,000.00 AZN`) for the English message text."""

from decimal import Decimal

from payproof.domain.money import Money

_MINUS = "−"  # U+2212, as in the prototype


def _seps(en: bool) -> tuple[str, str]:
    return (",", ".") if en else (".", ",")


def _group(digits: str, sep: str) -> str:
    return f"{int(digits):,}".replace(",", sep)


def format_money(m: Money, *, en: bool = False) -> str:
    """`12.000,00 AZN` (en: `12,000.00 AZN`); negative amounts get the typographic minus."""
    integer, frac = f"{abs(m.amount):.2f}".split(".")
    sign = _MINUS if m.amount < 0 else ""
    group, point = _seps(en)
    return f"{sign}{_group(integer, group)}{point}{frac} {m.currency}"


def format_qty(qty: Decimal, *, en: bool = False) -> str:
    """`1.200`, `12,5` (en: `1,200`, `12.5`) — trailing fraction zeros dropped."""
    integer, _, frac = f"{qty:f}".partition(".")
    frac = frac.rstrip("0")
    group, point = _seps(en)
    return _group(integer, group) + (f"{point}{frac}" if frac else "")
