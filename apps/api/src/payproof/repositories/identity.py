import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.models import Membership, User


class UserRepository:
    """Users are global (one person, many companies), so no tenant scope."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email.strip().lower()))
        return result.scalar_one_or_none()


class MembershipRepository:
    """Resolves the tenant for a user, so it runs before `bind_tenant`."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def active(self, user_id: uuid.UUID, company_id: uuid.UUID) -> Membership | None:
        result = await self.session.execute(
            select(Membership).where(
                Membership.user_id == user_id,
                Membership.company_id == company_id,
                Membership.active.is_(True),
            )
        )
        return result.scalar_one_or_none()
