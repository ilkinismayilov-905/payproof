"""Review actions on a package: order link suggestions and confirmation."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from payproof.api.deps import Member, Session, require
from payproof.core.errors import NotFound
from payproof.domain.permissions import Permission
from payproof.repositories.models import InvoicePackage
from payproof.schemas.detail import MatchCandidate
from payproof.services.package_detail import match_candidates

router = APIRouter(tags=["review"])
Viewer = Annotated[Member, Depends(require(Permission.VIEW))]


class CandidateList(BaseModel):
    items: list[MatchCandidate]


async def visible_package(session: Session, package_id: uuid.UUID) -> InvoicePackage:
    pkg = await session.scalar(
        select(InvoicePackage).where(
            InvoicePackage.id == package_id, InvoicePackage.deleted_at.is_(None)
        )
    )
    if pkg is None:
        raise NotFound  # also another company's package
    return pkg


@router.get("/packages/{package_id}/match-candidates")
async def list_match_candidates(
    package_id: uuid.UUID, session: Session, _: Viewer
) -> CandidateList:
    pkg = await visible_package(session, package_id)
    return CandidateList(items=await match_candidates(session, pkg))
