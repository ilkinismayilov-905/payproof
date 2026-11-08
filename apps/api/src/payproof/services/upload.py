"""Document upload: one transaction — idempotency key, version check, duplicate check, stored
file, new document version, package version bump, audit, extraction job."""

import hashlib
import uuid
from dataclasses import dataclass
from pathlib import PurePosixPath, PureWindowsPath
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from payproof.core.errors import Conflict, NotFound, PackageNotReady
from payproof.core.ids import uuid7
from payproof.repositories.models import Document, DocumentVersion, InvoicePackage, Job
from payproof.services import files, idempotency
from payproof.services.audit import record
from payproof.services.versioning import bump
from payproof.storage.s3 import Storage

LABEL = {"invoice": "Faktura", "order": "Sifariş", "delivery": "Təhvil sənədi"}
REASON = {  # why the package version went up (approval invalidation text)
    "invoice": "fakturanın yeni versiyası yükləndi",
    "order": "sifarişin yeni versiyası yükləndi",
    "delivery": "təhvil sənədinin yeni versiyası yükləndi",
}


@dataclass(frozen=True)
class Upload:
    file_name: str
    data: bytes
    expected_version: int


@dataclass(frozen=True)
class Outcome:
    status_code: int  # 202 accepted, 409 duplicate (both replayed for the same key)
    body: dict[str, Any]


def clean_name(raw: str) -> str:
    """Base name only (browsers may send a path), at most 255 characters."""
    name = PureWindowsPath(PurePosixPath(raw).name).name.strip()
    return name[:255] or "fayl"


async def _locked_package(session: AsyncSession, package_id: uuid.UUID) -> InvoicePackage:
    pkg = await session.scalar(
        select(InvoicePackage)
        .where(InvoicePackage.id == package_id, InvoicePackage.deleted_at.is_(None))
        .with_for_update()  # uploads to one package run one after another
    )
    if pkg is None:
        raise NotFound  # also another company's package
    return pkg


async def upload(
    session: AsyncSession,
    storage: Storage,
    *,
    actor_id: uuid.UUID,
    package_id: uuid.UUID,
    doc_type: str,
    up: Upload,
    endpoint: str,
    key: uuid.UUID,
) -> Outcome:
    info = files.inspect(up.data)  # 413 / 415 before anything is written
    name = clean_name(up.file_name)
    fingerprint = f"{endpoint}|{package_id}|{doc_type}|{up.expected_version}|{info.sha256}|{name}"
    replay = await idempotency.claim(
        session,
        endpoint=endpoint,
        key=key,
        request_hash=hashlib.sha256(fingerprint.encode()).hexdigest(),
    )
    if replay:  # before the version check: a retry after success carries the old version
        return Outcome(replay.status_code, replay.body)
    pkg = await _locked_package(session, package_id)
    if pkg.processing:
        raise PackageNotReady(details={"status": "PROCESSING"})
    if up.expected_version != pkg.version:
        raise Conflict(
            f"Paket v{pkg.version}-ə yenilənib; səhifəni yeniləyin.",
            {"current_version": pkg.version, "expected_version": up.expected_version},
        )
    outcome = await _store(session, storage, actor_id, pkg, doc_type, name, up.data, info)
    await idempotency.complete(
        session, endpoint=endpoint, key=key, status_code=outcome.status_code, body=outcome.body
    )
    await session.commit()
    return outcome


async def _store(
    session: AsyncSession,
    storage: Storage,
    actor_id: uuid.UUID,
    pkg: InvoicePackage,
    doc_type: str,
    name: str,
    data: bytes,
    info: files.FileInfo,
) -> Outcome:
    doc = await session.scalar(
        select(Document).where(Document.package_id == pkg.id, Document.type == doc_type)
    )
    if doc is None:
        doc = Document(company_id=pkg.company_id, package_id=pkg.id, type=doc_type)
        session.add(doc)
        await session.flush()
    last = await session.scalar(
        select(func.max(DocumentVersion.version_no)).where(DocumentVersion.document_id == doc.id)
    )
    version_id = uuid7()
    storage_key = f"{pkg.company_id}/{pkg.id}/{version_id}"  # never the client's file name
    # shortcut: the object is written before COMMIT; a failed commit leaves an orphan object,
    # never a version without its file — sweep orphans when storage cleanup is needed
    await storage.put(storage_key, data, info.mime)
    await bump(session, pkg, REASON[doc_type])
    version = DocumentVersion(
        id=version_id,
        company_id=pkg.company_id,
        document_id=doc.id,
        version_no=(last or 0) + 1,
        file_name=name,
        storage_key=storage_key,
        sha256=info.sha256,
        mime=info.mime,
        size=len(data),
        pages=info.pages,
        source_kind=info.source_kind,
        uploaded_by=actor_id,
        package_version_at_upload=pkg.version,
    )
    job = Job(
        company_id=pkg.company_id,
        kind="extract_document",
        payload={"document_version_id": str(version_id), "package_id": str(pkg.id)},
    )
    session.add_all([version, job])
    await session.flush()
    await record(
        session,
        actor_id=actor_id,
        action="document.uploaded",
        message=f"{LABEL[doc_type]}: {name} (sənəd v{version.version_no}) · paket v{pkg.version}",
        object_type="document_version",
        object_id=version.id,
        package=pkg,
    )
    body = {
        "job_id": str(job.id),
        "package_id": str(pkg.id),
        "document_id": str(doc.id),
        "document_version_id": str(version.id),
    }
    return Outcome(202, body)
