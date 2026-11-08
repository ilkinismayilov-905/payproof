// R-005 unit price and R-006 quantity — only when R-004 made invoice and order comparable.
import products from "../../../../fixtures/products.json";
import { cents, decimal } from "../money";
import { money, qty } from "./evidence";
import type { Ctx } from "./index";

const UNIT: Record<string, string> = Object.fromEntries(products.map((p) => [p.code, p.unit]));
const line = (code: string) => `line:${code}`;

export function r005({ o, p, comparable, add, E }: Ctx) {
  const cur = p.currency;
  if (!comparable || !o) {
    add(
      "R-005",
      "UNKNOWN",
      "Valyuta və vahid uyğunluğu təsdiqlənmədən qiymət müqayisə edilmir.",
      [],
      {
        cascade: true,
      },
    );
    return;
  }
  const missing: string[] = [];
  const diffs: { code: string; inv: number; ord: number; qty: number; diff: number }[] = [];
  for (const l of p.invoice.lines) {
    const ol = o.lines.find((x) => x.product_code === l.product_code);
    if (!ol) missing.push(l.product_code);
    else if (ol.unit_price !== l.unit_price) {
      const inv = cents(l.unit_price);
      const ord = cents(ol.unit_price);
      diffs.push({ code: l.product_code, inv, ord, qty: l.qty, diff: (inv - ord) * l.qty });
    }
  }
  if (missing.length)
    add(
      "R-005",
      "UNKNOWN",
      `Sifarişdə olmayan sətir: ${missing.join(", ")}. Avtomatik uyğun sayılmır.`,
      missing.map((c) => E("invoice", line(c))),
    );
  else if (diffs.length) {
    const total = diffs.reduce((a, x) => a + x.diff, 0);
    add(
      "R-005",
      "FAIL",
      diffs
        .map(
          (x) =>
            `${x.code}: fakturada ${money(x.inv, cur)}, sifarişdə ${money(x.ord, cur)} × ${qty(x.qty)} = ${money(x.diff, cur)} fərq`,
        )
        .join("; ") + ". Aktual qiymət əlavəsini yoxlayın. Fərq itki və ya gəlir sayılmır.",
      diffs.flatMap((x) => [E("invoice", line(x.code)), E("order", line(x.code))]),
      {
        fix_hint: "upload_invoice",
        data: { line_difference: { amount: decimal(total), currency: cur } },
      },
    );
  } else {
    const first = p.invoice.lines[0]!.product_code;
    add("R-005", "PASS", `${p.invoice.lines.length} sətirdə vahid qiymət sifarişlə eynidir.`, [
      E("invoice", line(first)),
      E("order", line(first)),
    ]);
  }
}

export function r006({ o, p, comparable, add, E }: Ctx) {
  if (!comparable || !o) {
    add(
      "R-006",
      "UNKNOWN",
      "Miqdar müqayisəsi sifariş və vahid uyğunluğu təsdiqləndikdən sonra aparılır.",
      [],
      {
        cascade: true,
      },
    );
    return;
  }
  const d = p.delivery;
  const dlOk = !!d && d.po_ref === o.po_number && d.customer_id === p.customer_id;
  const probs: string[] = [];
  const evs = [];
  for (const l of p.invoice.lines) {
    const code = l.product_code;
    const ol = o.lines.find((x) => x.product_code === code);
    if (ol && ol.qty !== l.qty) {
      probs.push(`${code}: fakturada ${qty(l.qty)}, sifarişdə ${qty(ol.qty)} ${UNIT[code]}`);
      evs.push(E("invoice", line(code)), E("order", line(code)));
    }
    if (dlOk) {
      const dq = d.lines.find((x) => x.product_code === code)?.qty ?? 0;
      if (dq !== l.qty) {
        probs.push(`${code}: fakturada ${qty(l.qty)}, təhvil aktında ${qty(dq)} ${UNIT[code]}`);
        evs.push(E("invoice", line(code)), E("delivery", line(code)));
      }
    }
  }
  const first = p.invoice.lines[0]!.product_code;
  if (probs.length)
    add(
      "R-006",
      "FAIL",
      `${probs.join("; ")}. Qismən çatdırılma P0-da avtomatik uyğun sayılmır.`,
      evs,
      {
        fix_hint: "upload_invoice",
      },
    );
  else
    add(
      "R-006",
      "PASS",
      dlOk
        ? "Sifariş, faktura və təhvil miqdarları uyğundur."
        : "Faktura və sifariş miqdarları uyğundur; uyğun təhvil sənədi olmadığı üçün təhvil miqdarı müqayisə edilmədi.",
      [E("invoice", line(first)), dlOk ? E("delivery", line(first)) : null],
    );
}
