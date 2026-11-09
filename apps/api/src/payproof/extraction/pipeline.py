"""File → adapter (AI_PROVIDER) → validate → store. Plugs into the `extract_document` job."""

from sqlalchemy.ext.asyncio import AsyncSession

from payproof.core.settings import get_settings
from payproof.domain.enums import DocumentStatus
from payproof.extraction.base import ExtractionAdapter, ExtractionResult, validate
from payproof.extraction.llm import LlmAdapter
from payproof.extraction.mock import MockExtractionAdapter
from payproof.extraction.pdf import PdfTextAdapter
from payproof.extraction.persist import store
from payproof.extraction.previous import extraction_input
from payproof.repositories.models import Document, DocumentVersion, InvoicePackage
from payproof.services.audit import record
from payproof.storage.s3 import Storage
from payproof.worker.extract import Extractor


def get_adapter(provider: str | None = None) -> ExtractionAdapter:
    provider = provider or get_settings().ai_provider
    if provider == "mock":
        return MockExtractionAdapter()
    if provider == "pdf":
        return PdfTextAdapter()
    if provider == "llm":
        return LlmAdapter()
    raise ValueError(f"AI_PROVIDER={provider}")


def _ai_message(file_name: str, r: ExtractionResult) -> str:
    if "fallback" in r.meta:
        return f"{file_name}: AI çıxarışı əlçatmaz — sahələr naməlumdur, sənəddən əl ilə daxil edin"
    return f"{file_name}: sahələr AI ilə oxundu (model {r.meta['model']})"


def adapter_extractor(adapter: ExtractionAdapter, storage: Storage) -> Extractor:
    async def extract(s: AsyncSession, version: DocumentVersion) -> DocumentStatus:
        doc = await s.get_one(Document, version.document_id)
        pkg = await s.get_one(InvoicePackage, doc.package_id)
        data = await storage.get(version.storage_key)
        result = await adapter.extract(await extraction_input(s, version, pkg, doc.type, data))
        validate(result, pages=version.pages or 1)  # InvalidExtraction → retry, then FAILED
        if result.meta:  # model + prompt version, or why the AI was not used
            await record(
                s,
                actor_id=None,
                action="document.ai",
                message=_ai_message(version.file_name, result),
                object_type="document_version",
                object_id=version.id,
                package=pkg,
                detail=dict(result.meta),
            )
        return await store(s, version, pkg, result)

    return extract
