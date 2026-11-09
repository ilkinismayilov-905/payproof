"""Real-API extraction eval: tests/fixtures/ai-eval/* → LlmAdapter (AI_API_KEY, AI_MODEL from
settings) → field-by-field comparison with expected.json, time, tokens and cost.

`uv run python scripts/ai_eval.py [--out ../../docs/product/ai-extraction-eval.md]`
Never prints the key or the model's raw answer. Refuses to run above BUDGET_USD (estimate)."""

import argparse
import asyncio
import datetime as dt
import json
import sys
import time
import uuid
from decimal import Decimal
from pathlib import Path
from typing import Any

import anthropic
import pymupdf

from payproof.core.settings import get_settings
from payproof.extraction.base import ExtractionInput, ExtractionResult, validate
from payproof.extraction.llm import _TASK, PROMPT_VERSION, SYSTEM, LlmAdapter, _block, _media_type

DIR = Path(__file__).resolve().parents[1] / "tests/fixtures/ai-eval"
BUDGET_USD = Decimal(1)
OUTPUT_GUESS = 6000  # tokens per document incl. thinking, for the estimate only
PRICES = {  # USD per 1M tokens (input, output)
    "claude-haiku-5-5": (Decimal("0.10"), Decimal("0.50")),
    "claude-sonnet-5-5": (Decimal(2), Decimal(10)),
    "claude-opus-5-5": (Decimal(4), Decimal(20)),
}


class Metered:  # the real client, plus the last call's usage and wall time
    def __init__(self, inner: anthropic.AsyncAnthropic) -> None:
        self.messages = self
        self._inner = inner
        self.usage: Any = None
        self.seconds = 0.0

    async def create(self, **kw: Any) -> Any:
        start = time.perf_counter()
        msg = await self._inner.messages.create(**kw)
        self.seconds, self.usage = time.perf_counter() - start, msg.usage
        return msg


def _cost(model: str, tokens_in: int, tokens_out: int) -> Decimal:
    p_in, p_out = PRICES[model]
    return (tokens_in * p_in + tokens_out * p_out) / 1_000_000


def _src(e: dict[str, Any], data: bytes, customer_id: uuid.UUID) -> ExtractionInput:
    return ExtractionInput(
        e["file"], data, e["type"], False, customer_id, e["customer"], None, None
    )


async def _estimate(client: anthropic.AsyncAnthropic, model: str, docs: list[Any]) -> Decimal:
    total = Decimal(0)
    for e, data in docs:
        block = _block(data, _media_type(data) or "application/pdf")
        content: Any = [block, {"type": "text", "text": _TASK[e["type"]]}]
        message: Any = {"role": "user", "content": content}
        count = await client.messages.count_tokens(model=model, system=SYSTEM, messages=[message])
        total += _cost(model, count.input_tokens, OUTPUT_GUESS)
    return total


def _norm(v: object) -> str:
    if v is None:
        return "—"
    if isinstance(v, Decimal):
        return format(v.normalize(), "f")
    return str(v)


def _compare(e: dict[str, Any], r: ExtractionResult, cid: uuid.UUID) -> list[list[str]]:
    rows: list[list[str]] = []
    pages = {ev.field_path: ev.page for ev in r.evidence}

    def add(field: str, want: object, got: object, path: str | None, page: int | None) -> None:
        got_page = pages.get(path) if path else None
        same = _norm(Decimal(str(want)) if isinstance(got, Decimal) else want) == _norm(got)
        ok = same and (page is None or got_page == page)
        shown = "—" if got_page is None else str(got_page)
        if got_page is not None and page not in (None, got_page):
            shown += f" (gözlənilən {page})"
        rows.append([e["file"], field, _norm(want), _norm(got), shown, "✓" if ok else "✕"])

    if e["type"] == "invoice":
        inv = r.invoice
        by_code = {li.product_code: li for li in (inv.lines if inv else ())}
        add("po_ref", e["po_ref"], inv and inv.po_ref, "invoice.po_ref", 1)
        add("currency", e["currency"], inv and inv.currency, None, None)
        add("total", e["total"], inv and inv.total, "invoice.total", e["total_page"])
        for li in e["lines"]:
            got = by_code.get(li["product_code"])
            base = f"invoice.lines[{li['product_code']}]"
            add(f"{li['product_code']} qty", li["qty"], got and got.qty, f"{base}.qty", li["page"])
            add(f"{li['product_code']} unit", li["unit"], got and got.unit, None, None)
            add(f"{li['product_code']} unit_price", li["unit_price"], got and got.unit_price,
                f"{base}.unit_price", li["page"])  # fmt: skip
        extra = set(by_code) - {li["product_code"] for li in e["lines"]}
        if extra:
            rows.append([e["file"], "artıq sətir", "—", ", ".join(sorted(extra)), "—", "✕"])
    else:
        d = r.delivery
        add("note_number", e["note_number"], d and d.note_number, None, None)
        add("po_ref", e["po_ref"], d and d.po_ref, "delivery.po_ref", 1)
        add("customer (VÖEN)", "uyğun", "uyğun" if d and d.customer_id == cid else "—",
            "delivery.customer", 1)  # fmt: skip
        add("signed", e["signed"], d and d.signed, "delivery.signed", 1)
        add("delivery_date", e["delivery_date"], d and d.delivery_date, None, None)
        by_code = {li.product_code: li for li in (d.lines if d else ())}
        for li in e["lines"]:
            got = by_code.get(li["product_code"])
            add(f"{li['product_code']} qty", li["qty"], got and got.qty,
                f"delivery.lines[{li['product_code']}].qty", li["page"])  # fmt: skip
    return rows


async def main() -> str | int:
    s = get_settings()
    if s.ai_api_key is None:
        sys.stderr.write("AI_API_KEY is not set\n")
        return 2
    model = s.ai_model
    if model not in PRICES:
        sys.stderr.write(f"no price for {model}; add it to PRICES\n")
        return 2
    client = anthropic.AsyncAnthropic(
        api_key=s.ai_api_key.get_secret_value(), timeout=s.ai_timeout_s, max_retries=2
    )
    expected = json.loads((DIR / "expected.json").read_text())
    docs = [(e, (DIR / e["file"]).read_bytes()) for e in expected]
    estimate = await _estimate(client, model, docs)
    sys.stdout.write(f"model {model}, estimate ≤ ${estimate:.3f}\n")
    if estimate > BUDGET_USD:
        sys.stderr.write(f"estimate above ${BUDGET_USD}; not running\n")
        return 3
    rows: list[list[str]] = []
    stats: list[list[str]] = []
    total = Decimal(0)
    for e, data in docs:
        meter, cid = Metered(client), uuid.uuid4()
        r = await LlmAdapter(meter, model=model).extract(_src(e, data, cid))
        with pymupdf.open(stream=data, filetype="pdf") as pdf:  # type: ignore[no-untyped-call]
            validate(r, pages=pdf.page_count)  # source pages exist
        u = meter.usage
        cost = _cost(model, u.input_tokens, u.output_tokens) if u else Decimal(0)
        total += cost
        rows += _compare(e, r, cid)
        fallback = r.meta.get("fallback", "—")
        stats.append([e["file"], f"{meter.seconds:.1f}", str(u.input_tokens if u else 0),
                      str(u.output_tokens if u else 0), f"${cost:.4f}", fallback])  # fmt: skip
    report = _report(model, rows, stats, total)
    return report


def _table(head: list[str], rows: list[list[str]]) -> str:
    lines = ["| " + " | ".join(head) + " |", "|" + "---|" * len(head)]
    return "\n".join(lines + ["| " + " | ".join(r) + " |" for r in rows]) + "\n"


def _report(model: str, rows: list[list[str]], stats: list[list[str]], total: Decimal) -> str:
    ok = sum(r[-1] == "✓" for r in rows)
    today = dt.datetime.now(dt.UTC).date().isoformat()
    bad = [r for r in rows if r[-1] == "✕"]
    return (
        f"# AI çıxarışı — real yoxlama\n\n"
        f"Tarix: {today} · model `{model}` · prompt `{PROMPT_VERSION}` · "
        f"`apps/api/scripts/ai_eval.py` · sənədlər `apps/api/tests/fixtures/ai-eval/`\n\n"
        f"**Nəticə:** {ok}/{len(rows)} sahə uyğun · ümumi xərc ${total:.4f}\n\n"
        f"## Sahələr\n\n"
        + _table(["sənəd", "sahə", "gözlənilən", "çıxarılan", "səhifə", "uyğun?"], rows)
        + "\n## Vaxt, tokenlər, xərc\n\n"
        + _table(
            ["sənəd", "vaxt, s", "input", "output (thinking daxil)", "xərc", "fallback"], stats
        )
        + "\n## Uyğunsuzluqlar\n\n"
        + (
            "".join(f"- {r[0]} · {r[1]}: gözlənilən {r[2]}, çıxarılan {r[3]}\n" for r in bad)
            or "Yoxdur.\n"
        )
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", type=Path)
    out = parser.parse_args().out
    result = asyncio.run(main())
    if isinstance(result, int):
        sys.exit(result)
    sys.stdout.write(result)
    if out:
        out.write_text(result)
