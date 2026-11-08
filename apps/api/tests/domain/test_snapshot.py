import dataclasses
from decimal import Decimal

import pytest

from payproof.domain.enums import Currency
from payproof.domain.money import Money
from payproof.domain.snapshot import InvoiceLine, Rules


def test_documents_are_frozen() -> None:
    line = InvoiceLine("GY-1L", Decimal("800"), "ədəd", Money("9.00", Currency.AZN))
    with pytest.raises(dataclasses.FrozenInstanceError):
        line.qty = Decimal("1")  # type: ignore[misc]


@pytest.mark.parametrize("tolerance", ["-0.01", "1.01"])
def test_tolerance_range(tolerance: str) -> None:
    with pytest.raises(ValueError, match="tolerance"):
        Rules(True, True, True, Decimal(tolerance))
