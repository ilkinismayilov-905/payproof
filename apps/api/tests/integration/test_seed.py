from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.base import bind_tenant
from payproof.repositories.models import (
    Company,
    Customer,
    Document,
    DocumentVersion,
    InvoicePackage,
    Membership,
    Order,
    OrderLine,
    RequirementSet,
    User,
)
from payproof.seed.fixtures import EXPECTED, ORDERS, PACKAGES, load, uid
from payproof.seed.identity import identity_rows
from payproof.seed.packages import package_rows


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


async def test_package_rows_match_fixture_counts(db: AsyncSession) -> None:
    for group in identity_rows() + package_rows():
        db.add_all(group)
        await db.flush()
    bind_tenant(db, uid("company_a"))
    packages = list(PACKAGES.values())
    assert await _count(db, Order) == EXPECTED["counts"]["orders"] == 18
    assert await _count(db, OrderLine) == sum(len(o["lines"]) for o in ORDERS.values())
    assert await _count(db, InvoicePackage) == 14
    assert await _count(db, Document) == sum(len(p["documents"]) for p in packages)
    assert await _count(db, DocumentVersion) == sum(
        len(d["versions"]) for p in packages for d in p["documents"]
    )
    # problem_since = creation time of packages in NEEDS_REVIEW / NEEDS_FIX (fixtures/README.md)
    problem = {
        uid(p["id"])
        for n, p in PACKAGES.items()
        if EXPECTED["packages"][n]["status"] in ("NEEDS_REVIEW", "NEEDS_FIX")
    }
    rows = (await db.execute(select(InvoicePackage.id, InvoicePackage.problem_since))).all()
    assert {pid for pid, since in rows if since is not None} == problem


async def test_assignees_keep_their_role(db: AsyncSession) -> None:
    for group in identity_rows():
        db.add_all(group)
        await db.flush()
    rows = (await db.execute(select(Membership.user_id, Membership.role))).all()
    roles = {user_id: role for user_id, role in rows}
    assert roles[uid("u3")] == "assignee"  # ADR-0008: warehouse staff
    assert roles[uid("u2")] == "approver"
