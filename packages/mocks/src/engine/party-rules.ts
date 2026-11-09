// R-003 same buyer on every document, R-004 same currency (sets ctx.comparable for R-005/R-006).
import { unitOf } from "./evidence";
import type { Ctx } from "./index";

export function r003({ db, o, p, add, E }: Ctx) {
  const d = p.delivery;
  const wrongDl = !!d && d.customer_id !== null && d.customer_id !== p.customer_id;
  const wrongO = !!o && o.customer_id !== p.customer_id;
  const buyer = db.customer(p.customer_id);
  if (wrongDl || wrongO) {
    const other = db.customer(wrongDl ? d!.customer_id! : o!.customer_id).name;
    add(
      "R-003",
      "FAIL",
      {
        az: `${wrongDl ? "Təhvil sənədi" : "Sifariş"} başqa alıcıya — ${other} — aid ola bilər. Faktura alıcısı: ${buyer.name}.`,
        en: `${wrongDl ? "The delivery note" : "The order"} may belong to another buyer — ${other}. Invoice buyer: ${buyer.name}.`,
      },
      [E("invoice", "customer"), wrongDl ? E("delivery", "customer") : E("order", "customer")],
      { fix_hint: wrongDl ? "upload_delivery" : null },
    );
  } else if (d && d.customer_id === null)
    // not in the rules table: an unread buyer must never count as "same buyer" (PASS)
    add(
      "R-003",
      "UNKNOWN",
      {
        az: "Təhvil sənədində alıcı oxunmadı — tərəflərin uyğunluğu təsdiqlənmir.",
        en: "The buyer was not read on the delivery note — the parties are not confirmed to match.",
      },
      [E("delivery", "customer")],
      { fix_hint: "edit_field" },
    );
  else if (!o)
    add(
      "R-003",
      "UNKNOWN",
      {
        az: "Sifariş təsdiqlənmədən tərəflər müqayisə olunmur.",
        en: "The parties are not compared until the order is confirmed.",
      },
      [],
      { cascade: true },
    );
  else
    add(
      "R-003",
      "PASS",
      {
        az: `Alıcı (VÖEN ${buyer.voen}) bütün sənədlərdə eynidir.`,
        en: `The buyer (TIN ${buyer.voen}) is the same on all documents.`,
      },
      [E("invoice", "customer"), E("order", "customer"), E("delivery", "customer")],
    );
}

export function r004(ctx: Ctx) {
  const { o, p, add, E } = ctx;
  const totals = [E("invoice", "total"), E("order", "total")];
  // lines missing from the order are R-005's finding; only shared lines are compared here
  const shared = p.invoice.lines.flatMap((l) => {
    const ol = o?.lines.find((x) => x.product_code === l.product_code);
    return ol ? [{ code: l.product_code, inv: unitOf(l), ord: unitOf(ol) }] : [];
  });
  const mismatch = shared.filter((x) => x.inv && x.ord && x.inv !== x.ord);
  const unread = shared.filter((x) => !x.inv || !x.ord);
  if (!o)
    add(
      "R-004",
      "UNKNOWN",
      {
        az: "Sifariş təsdiqlənmədən valyuta və vahid müqayisə olunmur.",
        en: "Currency and units are not compared until the order is confirmed.",
      },
      [],
      { cascade: true },
    );
  else if (o.currency !== p.currency)
    add(
      "R-004",
      "UNKNOWN",
      {
        az: `Faktura ${p.currency}, sifariş ${o.currency} ilə tərtib olunub. Valyuta avtomatik çevrilmir — qiymət müqayisəsi dayandırıldı.`,
        en: `The invoice is in ${p.currency}, the order in ${o.currency}. Currency is not converted automatically — price comparison stopped.`,
      },
      totals,
      { fix_hint: "upload_invoice" },
    );
  else if (mismatch.length)
    add(
      "R-004",
      "UNKNOWN",
      {
        az: `Ölçü vahidi fərqlidir: ${mismatch.map((x) => `${x.code} (faktura: ${x.inv}, sifariş: ${x.ord})`).join("; ")}. Təsdiqlənmiş çevirmə qaydası olmadığı üçün qiymət müqayisəsi dayandırıldı.`,
        en: `Units of measure differ: ${mismatch.map((x) => `${x.code} (invoice: ${x.inv}, order: ${x.ord})`).join("; ")}. There is no confirmed conversion rule, so price comparison stopped.`,
      },
      totals,
      { data: { unit_mismatch: mismatch.map((x) => x.code) } },
    );
  else if (unread.length)
    // an unread unit is never "units match": prices could be per box vs per piece
    add(
      "R-004",
      "UNKNOWN",
      {
        az: `Ölçü vahidi oxunmadı: ${unread.map((x) => `${x.code} (${x.inv ? "sifariş" : "faktura"})`).join("; ")}. Vahid uyğunluğu təsdiqlənmədən qiymət müqayisəsi dayandırıldı.`,
        en: `Unit of measure not read: ${unread.map((x) => `${x.code} (${x.inv ? "order" : "invoice"})`).join("; ")}. Price comparison stopped until the units are confirmed.`,
      },
      totals,
      { fix_hint: "edit_field", data: { unit_unread: unread.map((x) => x.code) } },
    );
  else {
    ctx.comparable = true;
    add(
      "R-004",
      "PASS",
      {
        az: `Valyuta (${p.currency}) və ölçü vahidləri uyğundur.`,
        en: `Currency (${p.currency}) and units of measure match.`,
      },
      totals,
    );
  }
}
