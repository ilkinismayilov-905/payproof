"""Validation runs behind fixture approvals, approvals, exports, tasks and notifications."""

import datetime as dt
import uuid
from collections.abc import Sequence

from payproof.domain.rules.engine import ENGINE_VERSION
from payproof.repositories.models import (
    ApprovalRecord,
    ExportRecord,
    Notification,
    ResolutionTask,
    ValidationRun,
)
from payproof.repositories.orm import Base
from payproof.seed.fixtures import PACKAGES, Fixture, load, uid
from payproof.seed.identity import COMPANY_ID, rule_set_id
from payproof.seed.packages import ts, version_id


def _run_id(pid: str, version: int, rules: int) -> uuid.UUID:
    return uid(f"{pid}:run:v{version}:rules{rules}")


def _approval_id(pid: str, version: int, index: int) -> uuid.UUID:
    return uid(f"{pid}:approval:v{version}:{index}")


def _runs_and_approvals(p: Fixture) -> tuple[list[ValidationRun], list[ApprovalRecord]]:
    """Each approval points at the run it saw (5-column FK): a run for that package version
    under that rule set. Historical runs carry no check results — only the current run does
    (B-17)."""
    runs: dict[uuid.UUID, ValidationRun] = {}
    approvals = []
    for i, a in enumerate(p["approvals"]):
        pv, rsv = a["package_version"], a["requirement_set_version"]
        run_id, rs_id = _run_id(p["id"], pv, rsv), rule_set_id(p["customer_id"], rsv)
        runs.setdefault(
            run_id,
            ValidationRun(
                id=run_id,
                company_id=COMPANY_ID,
                customer_id=uid(p["customer_id"]),
                package_id=uid(p["id"]),
                package_version=pv,
                requirement_set_id=rs_id,
                engine_version=ENGINE_VERSION,
                created_at=ts(a["created_at"]),
            ),
        )
        approvals.append(
            ApprovalRecord(
                id=_approval_id(p["id"], pv, i),
                company_id=COMPANY_ID,
                validation_run_id=run_id,
                package_id=uid(p["id"]),
                package_version=pv,
                requirement_set_id=rs_id,
                approver_id=uid(a["approver_id"]),
                valid=a["valid"],
                invalidated_reason=a.get("invalidated_reason"),
                invalidated_at=ts(a["invalidated_at"]) if a.get("invalidated_at") else None,
                created_at=ts(a["created_at"]),
            )
        )
    return list(runs.values()), approvals


def _export(p: Fixture, e: Fixture) -> ExportRecord:
    pv = e["package_version"]
    index = next(i for i, a in enumerate(p["approvals"]) if a["package_version"] == pv)
    by_file = {
        v["file_name"]: (d["type"], v["version_no"]) for d in p["documents"] for v in d["versions"]
    }
    files = [
        {
            "document_version_id": str(version_id(p["id"], *by_file[name])),
            "type": by_file[name][0],
            "file_name": name,
        }
        for name in e["files"]
    ]
    return ExportRecord(
        id=uid(f"{p['id']}:export:v{pv}"),
        company_id=COMPANY_ID,
        package_id=uid(p["id"]),
        package_version=pv,
        approval_id=_approval_id(p["id"], pv, index),
        files=files,
        manifest_key=f"demo/{p['id']}/exports/v{pv}/manifest.json",
        created_by=uid(e["created_by"]),
        created_at=ts(e["created_at"]),
    )


def _task(t: Fixture) -> ResolutionTask:
    return ResolutionTask(
        id=uid(t["number"]),
        company_id=COMPANY_ID,
        number=t["number"],
        package_id=uid(t["package_id"]),
        rule_id=t["rule_id"],
        assignee_id=uid(t["assignee_id"]),
        created_by=uid(t["created_by"]),
        step=t["step"],
        due_date=dt.date.fromisoformat(t["due_date"]),
        status=t["status"],
        comment=t["comment"],
        resolved_at=ts(t["resolved_at"]) if t["resolved_at"] else None,
        created_at=ts(t["created_at"]),
    )


def _notification(i: int, n: Fixture) -> Notification:
    at = ts(n["created_at"])
    return Notification(
        id=uid(f"notification:{i}"),
        company_id=COMPANY_ID,
        user_id=uid(n["user_id"]),
        package_id=uid(n["package_id"]) if n["package_id"] else None,
        text=n["text"],
        read_at=at if n["read"] else None,  # fixtures only say "read"
        created_at=at,
    )


def workflow_rows() -> list[Sequence[Base]]:
    runs: list[Base] = []
    approvals: list[Base] = []
    for p in PACKAGES.values():
        r, a = _runs_and_approvals(p)
        runs += r
        approvals += a
    exports = [_export(p, e) for p in PACKAGES.values() for e in p["exports"]]
    tasks = [_task(t) for t in load("tasks.json")]
    notes = [_notification(i, n) for i, n in enumerate(load("notifications.json"))]
    return [runs, approvals, exports, tasks, notes]
