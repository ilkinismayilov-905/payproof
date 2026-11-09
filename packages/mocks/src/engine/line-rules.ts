// R-005 unit price and R-006 quantity — only when R-004 made invoice and order comparable.
import { cents, decimal } from "../money";
import { money, moneyEn, qty, qtyEn, unitOf } from "./evidence";
import type { Ctx } from "./index";

const line = (code: string) => `line:${code}`;
const CHECK_SOURCE = {
  az: "Mənbəyə baxıb sahəni təsdiqləyin.",
  en: "Check the source and confirm the field.",
};

/** Line rules on an invoice whose lines were not read: UNKNOWN, never a vacuous PASS. */
export function noLines({ p, add }: Ctx, rule: string) {
  if (p.invoice.lines.length) return false;
  add(
    rule,
    "UNKNOWN",
    {
      az: `Faktura sətirləri oxunmadı. ${CHECK_SOURCE.az}`,
      en: `Invoice lines were not read. ${CHECK_SOURCE.en}`,
    },
    [],
    { fix_hint: "edit_field" },
  );
  return true;
}

export function r005(ctx: Ctx) {
  const { o, p, comparable, add, E } = ctx;
  const cur = p.currency;
  if (!comparable || !o) {
    add(
      "R-005",
      "UNKNOWN",
      {
        az: "Valyuta və vahid uyğunluğu təsdiqlənmədən qiymət müqayisə edilmir.",
        en: "Prices are not compared until currency and units are confirmed.",
      },
      [],
      { cascade: true },
    );
    return;
  }
  if (noLines(ctx, "R-005")) return;
  const lines = p.invoice.lines;
  const missing = lines.filter((l) => !o.lines.some((x) => x.product_code === l.product_code));
  const unread = lines.filter((l) => l.unit_price === null || l.qty === null);
  const diffs: { code: string; inv: number; ord: number; qty: number; diff: number }[] = [];
  for (const l of lines) {
    const ol = o.lines.find((x) => x.product_code === l.product_code);
    if (ol && l.unit_price !== null && l.qty !== null && ol.unit_price !== l.unit_price) {
      const inv = cents(l.unit_price);
      const ord = cents(ol.unit_price);
      diffs.push({ code: l.product_code, inv, ord, qty: l.qty, diff: (inv - ord) * l.qty });
    }
  }
  const codes = (ls: typeof lines) => ls.map((l) => l.product_code).join(", ");
  if (missing.length)
    add(
      "R-005",
      "UNKNOWN",
      {
        az: `Sifarişdə olmayan sətir: ${codes(missing)}. Avtomatik uyğun sayılmır.`,
        en: `Line not on the order: ${codes(missing)}. It is not accepted automatically.`,
      },
      missing.map((l) => E("invoice", line(l.product_code))),
    );
  else if (unread.length)
    // not in the rules table: a difference cannot be computed, so this is never PASS
    add(
      "R-005",
      "UNKNOWN",
      {
        az: `Vahid qiymət və ya miqdar oxunmadı: ${codes(unread)}. ${CHECK_SOURCE.az}`,
        en: `Unit price or quantity not read: ${codes(unread)}. ${CHECK_SOURCE.en}`,
      },
      unread.map((l) => E("invoice", line(l.product_code))),
      { fix_hint: "edit_field" },
    );
  else if (diffs.length) {
    const total = diffs.reduce((a, x) => a + x.diff, 0);
    const az = diffs.map(
      (x) =>
        `${x.code}: fakturada ${money(x.inv, cur)}, sifarişdə ${money(x.ord, cur)} × ${qty(x.qty)} = ${money(x.diff, cur)} fərq`,
    );
    const en = diffs.map(
      (x) =>
        `${x.code}: ${moneyEn(x.inv, cur)} on the invoice, ${moneyEn(x.ord, cur)} on the order × ${qtyEn(x.qty)} = ${moneyEn(x.diff, cur)} difference`,
    );
    add(
      "R-005",
      "FAIL",
      {
        az: `${az.join("; ")}. Aktual qiymət əlavəsini yoxlayın. Fərq itki və ya gəlir sayılmır.`,
        en: `${en.join("; ")}. Check the current price addendum. The difference is not counted as a loss or a gain.`,
      },
      diffs.flatMap((x) => [E("invoice", line(x.code)), E("order", line(x.code))]),
      {
        fix_hint: "upload_invoice",
        data: { line_difference: { amount: decimal(total), currency: cur } },
      },
    );
  } else {
    const first = lines[0]!.product_code;
    const n = lines.length;
    add(
      "R-005",
      "PASS",
      {
        az: `${n} sətirdə vahid qiymət sifarişlə eynidir.`,
        en: `Unit prices match the order on ${n} line${n === 1 ? "" : "s"}.`,
      },
      [E("invoice", line(first)), E("order", line(first))],
    );
  }
}

export function r006(ctx: Ctx) {
  const { o, p, comparable, add, E } = ctx;
  if (!comparable || !o) {
    add(
      "R-006",
      "UNKNOWN",
      {
        az: "Miqdar müqayisəsi sifariş və vahid uyğunluğu təsdiqləndikdən sonra aparılır.",
        en: "Quantities are compared once the order and units are confirmed.",
      },
      [],
      { cascade: true },
    );
    return;
  }
  if (noLines(ctx, "R-006")) return;
  const d = p.delivery;
  const dlOk = !!d && d.po_ref === o.po_number && d.customer_id === p.customer_id;
  const lines = p.invoice.lines;
  // [code, document] of every quantity that was not read
  const unread: [string, "invoice" | "delivery"][] = lines
    .filter((l) => l.qty === null)
    .map((l) => [l.product_code, "invoice"]);
  if (dlOk)
    for (const l of lines)
      if (d.lines.find((x) => x.product_code === l.product_code)?.qty === null)
        unread.push([l.product_code, "delivery"]);
  if (unread.length) {
    // not in the rules table: an unread quantity is never "quantities match"
    const codes = [...new Set(unread.map(([c]) => c))].join(", ");
    add(
      "R-006",
      "UNKNOWN",
      {
        az: `Miqdar oxunmadı: ${codes}. ${CHECK_SOURCE.az}`,
        en: `Quantity not read: ${codes}. ${CHECK_SOURCE.en}`,
      },
      unread.map(([c, doc]) => E(doc, line(c))),
      { fix_hint: "edit_field" },
    );
    return;
  }
  const probs: string[] = [];
  const probsEn: string[] = [];
  const evs = [];
  for (const l of lines) {
    const code = l.product_code;
    const n = l.qty ?? 0;
    const ol = o.lines.find((x) => x.product_code === code);
    const u = unitOf(l) || (ol ? unitOf(ol) : null);
    const unit = u ? ` ${u}` : "";
    if (ol && ol.qty !== n) {
      probs.push(`${code}: fakturada ${qty(n)}, sifarişdə ${qty(ol.qty)}${unit}`);
      probsEn.push(`${code}: invoice ${qtyEn(n)}, order ${qtyEn(ol.qty)}${unit}`);
      evs.push(E("invoice", line(code)), E("order", line(code)));
    }
    if (dlOk) {
      const dq = d.lines.find((x) => x.product_code === code)?.qty ?? 0;
      if (dq !== n) {
        probs.push(`${code}: fakturada ${qty(n)}, təhvil aktında ${qty(dq)}${unit}`);
        probsEn.push(`${code}: invoice ${qtyEn(n)}, delivery note ${qtyEn(dq)}${unit}`);
        evs.push(E("invoice", line(code)), E("delivery", line(code)));
      }
    }
  }
  const first = lines[0]!.product_code;
  if (probs.length)
    add(
      "R-006",
      "FAIL",
      {
        az: `${probs.join("; ")}. Qismən çatdırılma P0-da avtomatik uyğun sayılmır.`,
        en: `${probsEn.join("; ")}. Partial delivery is not accepted automatically in P0.`,
      },
      evs,
      { fix_hint: "upload_invoice" },
    );
  else
    add(
      "R-006",
      "PASS",
      dlOk
        ? {
            az: "Sifariş, faktura və təhvil miqdarları uyğundur.",
            en: "Order, invoice and delivery quantities match.",
          }
        : {
            az: "Faktura və sifariş miqdarları uyğundur; uyğun təhvil sənədi olmadığı üçün təhvil miqdarı müqayisə edilmədi.",
            en: "Invoice and order quantities match; there is no matching delivery note, so delivered quantities were not compared.",
          },
      [E("invoice", line(first)), dlOk ? E("delivery", line(first)) : null],
    );
}
