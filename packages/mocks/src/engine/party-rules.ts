// R-003 same buyer on every document, R-004 same currency (sets ctx.comparable for R-005/R-006).
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
      `${wrongDl ? "Təhvil sənədi" : "Sifariş"} başqa alıcıya — ${other} — aid ola bilər. Faktura alıcısı: ${buyer.name}.`,
      [E("invoice", "customer"), wrongDl ? E("delivery", "customer") : E("order", "customer")],
      { fix_hint: wrongDl ? "upload_delivery" : null },
    );
  } else if (d && d.customer_id === null)
    // not in the rules table: an unread buyer must never count as "same buyer" (PASS)
    add(
      "R-003",
      "UNKNOWN",
      "Təhvil sənədində alıcı oxunmadı — tərəflərin uyğunluğu təsdiqlənmir.",
      [E("delivery", "customer")],
      { fix_hint: "edit_field" },
    );
  else if (!o)
    add("R-003", "UNKNOWN", "Sifariş təsdiqlənmədən tərəflər müqayisə olunmur.", [], {
      cascade: true,
    });
  else
    add("R-003", "PASS", `Alıcı (VÖEN ${buyer.voen}) bütün sənədlərdə eynidir.`, [
      E("invoice", "customer"),
      E("order", "customer"),
      E("delivery", "customer"),
    ]);
}

export function r004(ctx: Ctx) {
  const { o, p, add, E } = ctx;
  if (!o)
    add("R-004", "UNKNOWN", "Sifariş təsdiqlənmədən valyuta və vahid müqayisə olunmur.", [], {
      cascade: true,
    });
  else if (o.currency !== p.currency)
    add(
      "R-004",
      "UNKNOWN",
      `Faktura ${p.currency}, sifariş ${o.currency} ilə tərtib olunub. Valyuta avtomatik çevrilmir — qiymət müqayisəsi dayandırıldı.`,
      [E("invoice", "total"), E("order", "total")],
      { fix_hint: "upload_invoice" },
    );
  else {
    ctx.comparable = true;
    add("R-004", "PASS", `Valyuta (${p.currency}) və ölçü vahidləri uyğundur.`, [
      E("invoice", "total"),
      E("order", "total"),
    ]);
  }
}
