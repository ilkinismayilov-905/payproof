"""Resolution tasks: create for a failing/unknown check, move forward, cancel, list."""

import datetime as dt
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.api.deps import Member, Session, require
from payproof.domain.permissions import Permission
from payproof.repositories import package_reads as reads
from payproof.repositories.models import InvoicePackage, ResolutionTask
from payproof.schemas.auth import UserRef
from payproof.schemas.detail import Task
from payproof.services import detail_parts as parts
from payproof.services import tasks

router = APIRouter(tags=["tasks"])
Manager = Annotated[Member, Depends(require(Permission.MANAGE_TASKS))]


class CreateTask(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str = Field(pattern=r"^R-\d{3}$")
    assignee_id: uuid.UUID
    step: str = Field(min_length=3, max_length=1000)
    due_date: dt.date
    comment: str | None = Field(default=None, max_length=1000)


async def task_out(session: AsyncSession, t: ResolutionTask) -> Task:
    users = await reads.owners(session, {t.assignee_id, t.created_by})
    pkg = await session.get_one(InvoicePackage, t.package_id)

    def ref(user_id: uuid.UUID) -> UserRef:
        user, role = users[user_id]
        return UserRef(id=user.id, full_name=user.full_name, title=user.title, role=role)

    return parts.task(t, pkg.invoice_number or "", ref)


@router.post("/packages/{package_id}/tasks", status_code=201)
async def create_task(
    package_id: uuid.UUID, body: CreateTask, session: Session, member: Manager
) -> Task:
    new = tasks.NewTask(**body.model_dump())
    task = await tasks.create_task(session, actor_id=member.user_id, package_id=package_id, new=new)
    return await task_out(session, task)
