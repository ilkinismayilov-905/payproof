import uuid
from typing import Any

from sqlalchemy import (
    ARRAY,
    Boolean,
    CheckConstraint,
    Integer,
    Text,
    UniqueConstraint,
    Uuid,
    false,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from payproof.repositories.orm import Base, TenantEntity, one_of, same_tenant_fk, tenant_key

# shortcut: mirror `CheckOutcome` / `RuleId` in openapi.yaml; domain enums come in B-06
OUTCOMES = ("PASS", "FAIL", "UNKNOWN", "NOT_APPLICABLE")
RULE_ID_CHECK = "rule_id ~ '^R-0(0[1-9]|10)$'"


class ValidationRun(TenantEntity, Base):
    """One deterministic rule-engine run for a package version and a rule set version."""

    __tablename__ = "validation_runs"
    __table_args__ = (
        tenant_key(),
        same_tenant_fk("package_id", "invoice_packages"),
        same_tenant_fk("requirement_set_id", "requirement_sets"),
        CheckConstraint("package_version >= 1", name="package_version_positive"),
    )

    package_id: Mapped[uuid.UUID] = mapped_column()
    package_version: Mapped[int] = mapped_column(Integer)
    requirement_set_id: Mapped[uuid.UUID] = mapped_column()
    engine_version: Mapped[str] = mapped_column(Text)


class CheckResult(TenantEntity, Base):
    __tablename__ = "check_results"
    __table_args__ = (
        UniqueConstraint("validation_run_id", "rule_id"),
        same_tenant_fk("validation_run_id", "validation_runs"),
        one_of("outcome", OUTCOMES, "outcome_known"),
        CheckConstraint(RULE_ID_CHECK, name="rule_id_format"),
        CheckConstraint("jsonb_typeof(data) = 'object'", name="data_is_object"),
    )

    validation_run_id: Mapped[uuid.UUID] = mapped_column()
    rule_id: Mapped[str] = mapped_column(Text)
    outcome: Mapped[str] = mapped_column(Text)
    cascade: Mapped[bool] = mapped_column(Boolean, server_default=false())
    message: Mapped[str] = mapped_column(Text)
    data: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default=text("'{}'::jsonb"))
    evidence_ids: Mapped[list[uuid.UUID]] = mapped_column(
        ARRAY(Uuid), server_default=text("'{}'::uuid[]")
    )
