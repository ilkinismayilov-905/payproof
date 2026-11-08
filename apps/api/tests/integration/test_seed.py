from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.base import bind_tenant
from payproof.repositories.models import Company, Customer, Membership, RequirementSet, User
from payproof.seed.fixtures import load, uid
from payproof.seed.identity import identity_rows


async def _count(db: AsyncSession, model: type) -> int:
    return (await db.execute(select(func.count()).select_from(model))).scalar_one()


async def test_identity_rows_match_fixture_counts(db: AsyncSession) -> None:
    for group in identity_rows():
        db.add_all(group)
        await db.flush()
    users, customers = load("users.json"), load("customers.json")
    assert await _count(db, Company) == 1
    assert await _count(db, User) == len(users) == 7
    assert await _count(db, Membership) == len(users)
    bind_tenant(db, uid("company_a"))
    assert await _count(db, Customer) == len(customers) == 2
    assert await _count(db, RequirementSet) == sum(len(c["requirement_sets"]) for c in customers)


async def test_assignees_keep_their_role(db: AsyncSession) -> None:
    for group in identity_rows():
        db.add_all(group)
        await db.flush()
    rows = (await db.execute(select(Membership.user_id, Membership.role))).all()
    roles = {user_id: role for user_id, role in rows}
    assert roles[uid("u3")] == "assignee"  # ADR-0008: warehouse staff
    assert roles[uid("u2")] == "approver"
