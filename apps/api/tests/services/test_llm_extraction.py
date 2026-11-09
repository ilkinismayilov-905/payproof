"""LlmAdapter with a fake client: no network, no key (CI)."""

import json
import uuid
from types import SimpleNamespace
from typing import Any

import anthropic
import httpx2

from payproof.extraction.base import ExtractionInput, validate
from payproof.extraction.llm import SYSTEM, LlmAdapter

PDF = b"%PDF-1.7 fake"
INVOICE = {
    "po_number": {"value": "PO-381", "page": 1, "quote": "Sifariş №: PO-381"},
    "currency": "AZN",
    "total": {"value": "1200.00", "page": 1, "quote": "Yekun: 1.200,00"},
    "lines": [
        {
            "product_code": "KY-10",
            "qty": {"value": "12", "page": 1, "quote": "KY-10 12 kg"},
            "unit": "kg",
            "unit_price": {"value": "100.00", "page": 1, "quote": "100,00"},
        }
    ],
}


class FakeClient:
    def __init__(self, answer: object = None, error: Exception | None = None) -> None:
        self.calls: list[dict[str, Any]] = []
        self.messages = self
        self._answer, self._error = answer, error

    async def create(self, **kw: Any) -> SimpleNamespace:
        self.calls.append(kw)
        if self._error:
            raise self._error
        text = self._answer if isinstance(self._answer, str) else json.dumps(self._answer)
        return SimpleNamespace(
            stop_reason="end_turn", content=[SimpleNamespace(type="text", text=text)]
        )


def src(data: bytes = PDF, doc_type: str = "invoice") -> ExtractionInput:
    return ExtractionInput("new.pdf", data, doc_type, False, uuid.uuid4(), "A MMC", None, None)


async def test_sends_the_pdf_with_the_schema_and_keeps_cited_values() -> None:
    client = FakeClient(INVOICE)
    r = await LlmAdapter(client, model="claude-test").extract(src())
    validate(r, pages=1)
    assert r.invoice is not None and r.invoice.po_ref == "PO-381" and not r.needs_review
    assert r.meta == {"source": "llm", "model": "claude-test", "prompt_version": "b25-v1"}
    call = client.calls[0]
    assert call["model"] == "claude-test" and call["system"] == SYSTEM
    assert "tools" not in call  # the model gets no tools
    doc = call["messages"][0]["content"][0]
    assert doc["type"] == "document" and doc["source"]["media_type"] == "application/pdf"
    assert call["output_config"]["format"]["schema"]["additionalProperties"] is False


async def test_image_goes_as_an_image_block() -> None:
    client = FakeClient(INVOICE)
    await LlmAdapter(client).extract(src(b"\x89PNG....", "invoice"))
    assert client.calls[0]["messages"][0]["content"][0]["type"] == "image"


def _assert_unknown(r: Any, reason: str) -> None:
    assert r.source == "mock" and r.meta["fallback"] == reason and r.needs_review
    assert r.invoice is not None and r.invoice.po_ref is None and r.invoice.total is None
    assert "invoice.po_ref" in r.invoice.unreadable and r.evidence == ()


async def test_no_key_falls_back_to_unknown() -> None:
    _assert_unknown(await LlmAdapter().extract(src()), "no_api_key")  # conftest: no key in tests


async def test_api_error_falls_back_to_unknown() -> None:
    error = anthropic.APITimeoutError(request=httpx2.Request("POST", "https://api.invalid"))
    _assert_unknown(await LlmAdapter(FakeClient(error=error)).extract(src()), "APITimeoutError")


async def test_unusable_answer_falls_back_to_unknown() -> None:
    bad = INVOICE | {"verdict": "PASS"}
    _assert_unknown(await LlmAdapter(FakeClient(bad)).extract(src()), "invalid_output")
    _assert_unknown(await LlmAdapter(FakeClient("not json")).extract(src()), "invalid_output")


async def test_spreadsheet_is_read_without_the_model() -> None:
    client = FakeClient(INVOICE)
    r = await LlmAdapter(client).extract(src(b"product_code;qty;unit;unit_price\nKY-10;2;kg;5,00"))
    assert client.calls == [] and r.source == "pdf"
