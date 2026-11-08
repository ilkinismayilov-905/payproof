from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.repositories.base import bind_tenant
from payproof.repositories.models import (
    ApprovalRecord,
    Company,
    Customer,
    DeliveryNote,
    Document,
    DocumentVersion,
    ExportRecord,
    ExtractedField,
    ExtractedInvoice,
    ExtractedInvoiceLine,
    InvoicePackage,
    Membership,
    Notification,
    Order,
    OrderLine,
    RequirementSet,
    ResolutionTask,
    User,
    ValidationRun,
)
from payproof.seed.extraction import extraction_rows
from payproof.seed.fixtures import EXPECTED, ORDERS, PACKAGES, load, uid
from payproof.seed.identity import identity_rows
from payproof.seed.packages import package_rows
from payproof.seed.workflow import workflow_rows


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


async def test_extraction_rows_for_finished_packages(db: AsyncSession) -> None:
    for group in identity_rows() + package_rows() + extraction_rows():
        db.add_all(group)
        await db.flush()
    bind_tenant(db, uid("company_a"))
    done = [p for p in PACKAGES.values() if not p["processing"]]
    assert await _count(db, ExtractedInvoice) == len(done) == 13
    assert await _count(db, ExtractedInvoiceLine) == sum(len(p["invoice"]["lines"]) for p in done)
    assert await _count(db, DeliveryNote) == sum(1 for p in done if p["delivery"])
    review = (
        await db.execute(select(ExtractedField.field_path, ExtractedField.review_status))
    ).all()
    assert review == [("invoice.po_ref", "REVIEW_REQUIRED")]  # INV-1047 scan


async def test_workflow_rows(db: AsyncSession) -> None:
    for group in identity_rows() + package_rows() + extraction_rows() + workflow_rows():
        db.add_all(group)
        await db.flush()
    bind_tenant(db, uid("company_a"))
    packages = list(PACKAGES.values())
    assert await _count(db, ApprovalRecord) == sum(len(p["approvals"]) for p in packages) == 4
    # every approval sits on a run of its own version and rule set (5-column FK)
    assert await _count(db, ValidationRun) == 4
    assert await _count(db, ExportRecord) == 2
    assert await _count(db, ResolutionTask) == EXPECTED["counts"]["tasks"] == 9
    assert await _count(db, Notification) == len(load("notifications.json"))
    files = (await db.execute(select(ExportRecord.files))).scalars().first()
    assert files and set(files[0]) == {"document_version_id", "type", "file_name"}


async def test_assignees_keep_their_role(db: AsyncSession) -> None:
    for group in identity_rows():
        db.add_all(group)
        await db.flush()
    rows = (await db.execute(select(Membership.user_id, Membership.role))).all()
    roles = {user_id: role for user_id, role in rows}
    assert roles[uid("u3")] == "assignee"  # ADR-0008: warehouse staff
    assert roles[uid("u2")] == "approver"
