"""Request dependencies: who is calling, in which company, and may they do this."""

import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.core.auth import DevTokenVerifier, TokenVerifier
from payproof.core.db import get_session
from payproof.core.errors import Forbidden, Unauthenticated
from payproof.core.settings import get_settings
from payproof.domain.enums import Role
from payproof.domain.permissions import Permission, can
from payproof.repositories.base import bind_tenant
from payproof.repositories.identity import MembershipRepository

_bearer = HTTPBearer(auto_error=False)  # our own 401 body instead of FastAPI's 403

Session = Annotated[AsyncSession, Depends(get_session)]


@dataclass(frozen=True)
class Member:
    user_id: uuid.UUID
    company_id: uuid.UUID
    role: Role


def get_verifier() -> TokenVerifier:
    # shortcut: dev HS256 only; a JWKS verifier for the managed provider replaces this (ADR-0003)
    return DevTokenVerifier(get_settings().jwt_secret.get_secret_value())


async def current_member(
    session: Session,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    verifier: Annotated[TokenVerifier, Depends(get_verifier)],
) -> Member:
    """Token -> user -> active membership; binds the request session to that company.
    The tenant never comes from the request body or path."""
    if credentials is None:
        raise Unauthenticated
    user_id = verifier.verify(credentials.credentials)
    membership = await MembershipRepository(session).sign_in(user_id)
    if membership is None:  # removed, deactivated or an assignee (cannot sign in)
        raise Unauthenticated
    bind_tenant(session, membership.company_id)
    return Member(user_id, membership.company_id, Role(membership.role))


CurrentMember = Annotated[Member, Depends(current_member)]


def require(permission: Permission) -> Callable[[Member], Awaitable[Member]]:
    """`Depends(require(Permission.APPROVE_PACKAGE))` on every route (apps/api/CLAUDE.md)."""

    async def check(member: CurrentMember) -> Member:
        if not can(member.role, permission):
            raise Forbidden
        return member

    return check
