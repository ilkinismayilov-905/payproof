"""Write the synthetic AI-eval documents and their ground truth to tests/fixtures/ai-eval/.

`uv run python scripts/make_ai_eval_docs.py` — demo names from fixtures/ (A Distribusiya MMC,
customers c1/c2, products, PO numbers). Deterministic; re-run after editing DOCS."""

import json
import math
from decimal import Decimal
from pathlib import Path
from typing import Any

import pymupdf

OUT = Path(__file__).resolve().parents[1] / "tests/fixtures/ai-eval"
FONT = "/System/Library/Fonts/Supplemental/Courier New.ttf"  # monospace with ə ş ı ğ (macOS)
SELLER = "A Distribusiya MMC, VÖEN 1700123451, Bakı, Binəqədi r., M. Müşfiq küç. 12"
C1 = ("B Mağazalar Şəbəkəsi", "1402375611")
C2 = ("C Restoran Qrupu", "1305884421")


def _az(value: str) -> str:
    """ "8600.00" → "8.600,00" (Azerbaijani print format)."""
    whole, frac = f"{Decimal(value):,.2f}".split(".")
    return f"{whole.replace(',', '.')},{frac}"


def _page(doc: Any, lines: list[str], skew: float = 0.0) -> None:
    page = doc.new_page(width=595, height=842)
    page.insert_font(fontname="ar", fontfile=FONT)
    morph = (pymupdf.Point(50, 60), pymupdf.Matrix(skew)) if skew else None
    page.insert_text((50, 60), "\n".join(lines), fontname="ar", fontsize=9, morph=morph)


def _signature(doc: Any) -> None:
    """A hand-drawn signature and a round stamp in the receiver's field of the last page."""
    page = doc[-1]
    field = page.search_for("möhürü")[0]  # just under the receiver's label
    x, y = field.x0 - 40, field.y1 + 28
    shape = page.new_shape()
    pts = [pymupdf.Point(x + i * 4, y + 8 * math.sin(i / 2.2)) for i in range(30)]
    shape.draw_polyline(pts)
    shape.finish(color=(0.1, 0.1, 0.5), width=1.4)
    shape.draw_circle(pymupdf.Point(x + 150, y + 5), 32)
    shape.finish(color=(0.2, 0.3, 0.8), width=1.6)
    shape.commit()
    page.insert_font(fontname="ar", fontfile=FONT)
    blue = (0.2, 0.3, 0.8)
    page.insert_text((x + 128, y + 2), "C Restoran\n  Qrupu", fontname="ar", fontsize=7, color=blue)


def _as_scan(doc: Any) -> Any:
    """Rasterise every page: no text layer is left, like a scanner's output."""
    scan = pymupdf.open()
    for page in doc:
        pix = page.get_pixmap(dpi=110, colorspace=pymupdf.csGRAY)
        scan.new_page(width=page.rect.width, height=page.rect.height).insert_image(
            page.rect, pixmap=pix
        )
    return scan


def _invoice_head(no: str, date: str, customer: tuple[str, str], po: str, cur: str) -> list[str]:
    return [
        f"HESAB-FAKTURA № {no}",
        f"Tarix: {date}",
        "",
        f"Satıcı: {SELLER}",
        f"Alıcı: {customer[0]}, VÖEN {customer[1]}",
        f"Sifariş №: {po}          Valyuta: {cur}",
        "",
        "Kod        Malın adı                      Miqdar   Vahid    Qiymət      Məbləğ",
    ]


def _row(code: str, name: str, qty: int, unit: str, price: str, fmt: Any = _az) -> str:
    amount = f"{qty * Decimal(price):.2f}"
    return f"{code:<10} {name:<30} {qty:<8} {unit:<8} {fmt(price):<11} {fmt(amount)}"


def _en(value: str) -> str:
    return f"{Decimal(value):,.2f}"


DOCS: list[dict[str, Any]] = [
    {
        "file": "a_azn_invoice.pdf", "type": "invoice", "number": "INV-2101", "po": "PO-336",
        "currency": "AZN",
        "total": "8600.00", "customer": C1, "date": "05.11.2026",
        "lines": [("ST-1", "Şəkər tozu, 1 kq", 2000, "ədəd", "2.05", 1),
                  ("MK-500", "Makaron, 500 q", 1500, "ədəd", "1.40", 1),
                  ("CQ-250", "Qara çay, 250 q", 300, "qutu", "8.00", 1)],
        "note": "Ödəniş şərtləri: 30 gün ərzində köçürmə yolu ilə. Gecikmə üçün cərimə yoxdur.",
    },
    {
        "file": "b_usd_invoice.pdf", "type": "invoice", "number": "INV-2102", "po": "PO-395",
        "currency": "USD",
        "total": "1140.00", "customer": C2, "date": "November 3, 2026 (03/11/2026)",
        "lines": [("ZY-1L", "Zeytun yağı, 1 L", 120, "şüşə", "7.50", 1),
                  ("KY-200", "Kərə yağı, 200 q", 50, "ədəd", "4.80", 1)],
        "note": "Amounts in US dollars, English number format (1,140.00).", "en": True,
    },
    {
        "file": "c_scanned_invoice.pdf", "type": "invoice", "number": "INV-2103", "po": "PO-390",
        "currency": "AZN",
        "total": "2484.00", "customer": C2, "date": "06.11.2026", "scan": True,
        "lines": [("MS-05", "Mineral su, 0,5 L (12 əd.)", 120, "qutu", "7.20", 1),
                  ("CQ-250", "Qara çay, 250 q", 200, "qutu", "8.10", 1)],
        "note": "Skan surəti.",
    },
    {
        "file": "d_signed_delivery.pdf", "type": "delivery", "po": "PO-390", "number": "TQ-2104",
        "customer": C2, "date": "2026-11-04", "signed": True,
        "lines": [("MS-05", "Mineral su, 0,5 L (12 əd.)", 120, "qutu", "", 1),
                  ("CQ-250", "Qara çay, 250 q", 200, "qutu", "", 1)],
    },
    {
        "file": "e_two_page_invoice.pdf", "type": "invoice", "number": "INV-2105", "po": "PO-383",
        "currency": "AZN",
        "total": "8072.00", "customer": C1, "date": "07.11.2026", "total_page": 2,
        "lines": [("ST-1", "Şəkər tozu, 1 kq", 2000, "ədəd", "2.05", 1),
                  ("MK-500", "Makaron, 500 q", 1500, "ədəd", "1.40", 2),
                  ("KY-200", "Kərə yağı, 200 q", 520, "ədəd", "3.60", 2)],
        "note": "Müqavilə № 14/2026 üzrə. Malların keyfiyyəti sertifikatla təsdiqlənir.",
    },
]  # fmt: skip


def _invoice(d: dict[str, Any]) -> Any:
    fmt = _en if d.get("en") else _az
    head = _invoice_head(d["number"], d["date"], d["customer"], d["po"], d["currency"])
    rows = {p: [_row(c, n, q, u, pr, fmt) for c, n, q, u, pr, pg in d["lines"] if pg == p]
            for p in (1, 2)}  # fmt: skip
    total = f"Yekun: {fmt(d['total'])} {d['currency']}"
    doc = pymupdf.open()
    if d.get("total_page") == 2:
        filler = [f"{i}. {d['note']}" for i in range(1, 34)]  # pushes the table down
        _page(doc, [*head[:-1], "", *filler, "", head[-1], *rows[1], "(davamı növbəti səhifədə)"])
        _page(doc, ["Səhifə 2 / 2", "", head[-1], *rows[2], "", total, "", "Satıcı: ______"])
    else:
        _page(doc, [*head, *rows[1], "", total, "", d["note"], "", "Satıcı: ______"],
              skew=1.5 if d.get("scan") else 0.0)  # fmt: skip
    return _as_scan(doc) if d.get("scan") else doc


def _delivery(d: dict[str, Any]) -> Any:
    doc = pymupdf.open()
    lines = [
        f"TƏHVİL-TƏSLİM AKTI № {d['number']}", "Tarix: 04.11.2026", "",
        f"Təhvil verən: {SELLER}", f"Qəbul edən: {d['customer'][0]}, VÖEN {d['customer'][1]}",
        f"Əsas: sifariş {d['po']}", "", "Kod        Malın adı                      Miqdar   Vahid",
        *[f"{c:<10} {n:<30} {q:<8} {u}" for c, n, q, u, _, _ in d["lines"]],
        "", "Mallar tam həcmdə, zədəsiz təhvil verilmişdir.", "", "",
        "Təhvil verən: ____________           Qəbul edənin imzası və möhürü:",
    ]  # fmt: skip
    _page(doc, lines)
    _signature(doc)
    return doc


def _expected(d: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {"file": d["file"], "type": d["type"], "po_ref": d["po"]}
    if d["type"] == "invoice":
        out |= {"currency": d["currency"], "total": d["total"],
                "total_page": d.get("total_page", 1)}  # fmt: skip
        out["lines"] = [{"product_code": c, "qty": str(q), "unit": u, "unit_price": pr, "page": pg}
                        for c, _, q, u, pr, pg in d["lines"]]  # fmt: skip
    else:
        out |= {"note_number": d["number"], "customer_voen": d["customer"][1],
                "signed": d["signed"], "delivery_date": d["date"]}  # fmt: skip
        out["lines"] = [{"product_code": c, "qty": str(q), "page": pg}
                        for c, _, q, _, _, pg in d["lines"]]  # fmt: skip
    out["customer"] = f"{d['customer'][0]}, VÖEN {d['customer'][1]}"
    return out


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for d in DOCS:
        doc = _invoice(d) if d["type"] == "invoice" else _delivery(d)
        doc.subset_fonts()  # embed only the used glyphs
        doc.save(OUT / d["file"], garbage=4, deflate=True)
    expected = [_expected(d) for d in DOCS]
    (OUT / "expected.json").write_text(json.dumps(expected, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
