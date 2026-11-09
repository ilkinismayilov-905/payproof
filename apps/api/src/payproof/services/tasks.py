"""Resolution tasks (state-machines.md). People move OPEN → IN_PROGRESS → SUBMITTED_FOR_RECHECK;
only a passing re-validation makes one RESOLVED (validation_effects.settle_tasks)."""

import datetime as dt
import uuid
from dataclasses import dataclass

from sqlalchemy import Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.core.errors import NOT_A_MEMBER, Conflict, DomainError, ErrorCode, InvalidInput
from payproof.core.i18n import Msg
from payproof.domain.enums import CheckOutcome, Role, TaskStatus
from payproof.domain.rules.catalog import TITLES
from payproof.repositories.models import InvoicePackage, Membership, ResolutionTask
from payproof.services import notifications
from payproof.services.audit import record
from payproof.services.dashboard import BAKU
from payproof.services.linking import locked_package
from payproof.services.package_query import load_states

_OPEN_TO_ACT = {CheckOutcome.FAIL, CheckOutcome.UNKNOWN}
_SIGNS_IN = {Role.OPERATOR, Role.APPROVER, Role.ADMIN}  # assignees and readonly get no notice


class TaskAlreadyOpen(Conflict):
    code = ErrorCode.TASK_ALREADY_OPEN


class TaskStatusNotAllowed(DomainError):
    status_code = 422
    code = ErrorCode.TASK_STATUS_NOT_ALLOWED
    message = Msg(
        "Tapşırığı yalnız sistem həll edilmiş kimi bağlayır — uyğun qayda keçəndə.",
        "Only the system closes a task as resolved — when the matching rule passes.",
    )


@dataclass(frozen=True)
class NewTask:
    rule_id: str
    assignee_id: uuid.UUID
    step: str
    due_date: dt.date
    comment: str | None = None


def today() -> dt.date:
    return dt.datetime.now(BAKU).date()


def check_due(due: dt.date) -> None:
    if due < today():
        msg = Msg("Son tarix keçmişdə ola bilməz.", "The due date cannot be in the past.")
        raise InvalidInput(msg, {"fields": {"due_date": "keçmiş"}})


async def assignee_role(session: AsyncSession, company_id: uuid.UUID, user_id: uuid.UUID) -> Role:
    role = await session.scalar(
        select(Membership.role).where(
            Membership.user_id == user_id,
            Membership.company_id == company_id,
            Membership.active.is_(True),
        )
    )
    if role is None:
        raise InvalidInput(NOT_A_MEMBER, {"fields": {"assignee_id": "?"}})
    return Role(role)


async def notify(
    session: AsyncSession, pkg: InvoicePackage, user_id: uuid.UUID, role: Role, text: Msg
) -> None:
    """Only people who can sign in are told (assignees work through the operator)."""
    if role in _SIGNS_IN:
        await notifications.notify(session, pkg, [user_id], text)


async def create_task(
    session: AsyncSession, *, actor_id: uuid.UUID, package_id: uuid.UUID, new: NewTask
) -> ResolutionTask:
    pkg = await locked_package(session, package_id)
    [state] = await load_states(session, [pkg.id])
    outcome = next((c.outcome for c in state.checks if c.rule_id == new.rule_id), None)
    if outcome not in _OPEN_TO_ACT:
        raise InvalidInput(
            Msg(
                "Tapşırıq yalnız uyğunsuz və ya naməlum yoxlama üçün yaradılır.",
                "A task is created only for a failed or unknown check.",
            ),
            {"fields": {"rule_id": outcome.value if outcome else "yoxdur"}},
        )
    if open_ := await session.scalar(
        select(ResolutionTask).where(
            ResolutionTask.package_id == pkg.id,
            ResolutionTask.rule_id == new.rule_id,
            ResolutionTask.status != TaskStatus.RESOLVED,
            ResolutionTask.deleted_at.is_(None),
        )
    ):
        raise TaskAlreadyOpen(
            Msg(
                f"Bu qayda üçün açıq tapşırıq artıq var: {open_.number}.",
                f"There is already an open task for this rule: {open_.number}.",
            ),
            {"task_id": str(open_.id), "number": open_.number},
        )
    check_due(new.due_date)
    role = await assignee_role(session, pkg.company_id, new.assignee_id)
    last = await session.scalar(  # "T-124" → 124; numbers run per company
        select(func.max(cast(func.substr(ResolutionTask.number, 3), Integer)))
    )
    task = ResolutionTask(
        company_id=pkg.company_id, number=f"T-{(last or 0) + 1}", package_id=pkg.id,
        rule_id=new.rule_id, assignee_id=new.assignee_id, created_by=actor_id,
        step=new.step, due_date=new.due_date, comment=new.comment,
    )  # fmt: skip
    session.add(task)
    await session.flush()
    await record(
        session, actor_id=actor_id, action="task.created",
        message=f"{task.number} · {task.rule_id} · son tarix {task.due_date:%d.%m.%Y}",
        object_type="task", object_id=task.id, package=pkg,
    )  # fmt: skip
    if new.assignee_id != actor_id:
        title = TITLES[task.rule_id]
        text = Msg(
            f"Yeni tapşırıq {task.number}: {pkg.invoice_number} — {title.az}",
            f"New task {task.number}: {pkg.invoice_number} — {title.en}",
        )
        await notify(session, pkg, new.assignee_id, role, text)
    await session.commit()
    return task
