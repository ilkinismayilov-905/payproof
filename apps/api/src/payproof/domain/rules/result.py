"""Rule output (docs/architecture/rules-engine.md). Every rule blocks when FAIL or UNKNOWN."""

from collections.abc import Mapping
from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from payproof.domain.enums import CheckOutcome
from payproof.domain.snapshot import EvidenceRef, PackageSnapshot


class FixHint(StrEnum):
    """Which fix the UI offers; mirrors `CheckResult.fix_hint` in openapi.yaml."""

    EDIT_FIELD = "edit_field"
    UPLOAD_INVOICE = "upload_invoice"
    UPLOAD_DELIVERY = "upload_delivery"
    LINK_ORDER = "link_order"
    REVIEW_SIGNATURE = "review_signature"


@dataclass(frozen=True)
class CheckResult:
    rule_id: str
    outcome: CheckOutcome
    message: str  # Azerbaijani; shows only values the rule computed or read
    evidence: tuple[EvidenceRef, ...] = ()
    cascade: bool = False  # blocked by another problem: blocks, but is not a primary problem
    fix_hint: FixHint | None = None
    data: Mapping[str, Any] = field(default_factory=dict)


def evidence_for(s: PackageSnapshot, *paths: str) -> tuple[EvidenceRef, ...]:
    """Evidence refs of the given field paths, in order; a path without a source is skipped."""
    return tuple(s.evidence[p] for p in paths if p in s.evidence)
