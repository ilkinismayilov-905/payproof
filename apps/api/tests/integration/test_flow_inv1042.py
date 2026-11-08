"""Golden flow INV-1042 (expected.json): confirm the link, then upload the corrected invoice."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from payproof.extraction.mock import MockExtractionAdapter
from payproof.extraction.pipeline import adapter_extractor
from payproof.repositories.base import bind_tenant
from payproof.repositories.models import InvoicePackage
from payproof.seed.cli import seed
from payproof.seed.fixtures import EXPECTED, uid
from payproof.seed.identity import COMPANY_ID
from payproof.services.linking import confirm_link
from payproof.services.package_query import PackageState, load_states
from payproof.services.upload import Upload, upload
from payproof.storage.s3 import get_storage
from payproof.worker.extract import extract_handler
from payproof.worker.queue import PostgresQueue
from payproof.worker.runner import run_once

STEPS = {s["step"]: s for s in EXPECTED["flows"]["INV-1042"]}


async def _state(db: AsyncSession) -> PackageState:
    [state] = await load_states(db, [uid("pkg_1042")])
    return state


def _matches(state: PackageState, step: dict[str, object]) -> None:
    blockers = [{"rule_id": b.rule_id, "outcome": b.outcome.value} for b in state.blockers]
    assert (state.status.value, state.package.version, blockers) == (
        step["status"],
        step["version"],
        step["blockers"],
    ), step["step"]


async def test_link_then_corrected_invoice(db: AsyncSession) -> None:
    await seed(db)
    bind_tenant(db, COMPANY_ID)
    step = STEPS["confirm_link"]
    await confirm_link(
        db, actor_id=uid("u1"), package_id=uid("pkg_1042"), order_id=uid("PO-381"),
        expected_version=1,
    )  # fmt: skip
    _matches(await _state(db), step)

    step = STEPS["upload_invoice"]
    pkg = await db.get_one(InvoicePackage, uid("pkg_1042"))
    await upload(
        db, get_storage(), actor_id=uid("u1"), package_id=pkg.id, doc_type="invoice",
        up=Upload(str(step["file_name"]), b"%PDF-1.7 " + uuid.uuid4().bytes, pkg.version),
        endpoint="uploadDocument", key=uuid.uuid4(),
    )  # fmt: skip
    sessions = async_sessionmaker(
        bind=await db.connection(), join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    handler = extract_handler(adapter_extractor(MockExtractionAdapter(), get_storage()))
    assert await run_once(sessions, PostgresQueue(), {"extract_document": handler})
    db.expire_all()
    state = await _state(db)
    _matches(state, step)
    checks = {c.rule_id: c.outcome.value for c in state.checks}
    assert {k: checks[k] for k in step["checks"]} == step["checks"]


async def test_exact_po_in_a_new_invoice_links_by_itself(db: AsyncSession) -> None:
    await seed(db)
    bind_tenant(db, COMPANY_ID)
    pkg = await db.get_one(InvoicePackage, uid("pkg_1042"))
    assert pkg.order_id is None
    await upload(
        db, get_storage(), actor_id=uid("u1"), package_id=pkg.id, doc_type="invoice",
        up=Upload("INV-1042_v2_PO-381.pdf", b"%PDF-1.7 " + uuid.uuid4().bytes, pkg.version),
        endpoint="uploadDocument", key=uuid.uuid4(),
    )  # fmt: skip
    sessions = async_sessionmaker(
        bind=await db.connection(), join_transaction_mode="create_savepoint", expire_on_commit=False
    )
    handler = extract_handler(adapter_extractor(MockExtractionAdapter(), get_storage()))
    assert await run_once(sessions, PostgresQueue(), {"extract_document": handler})
    await db.refresh(pkg)
    assert (pkg.order_id, pkg.link_method, pkg.link_confirmed_by) == (
        uid("PO-381"),
        "exact_id",
        None,
    )
