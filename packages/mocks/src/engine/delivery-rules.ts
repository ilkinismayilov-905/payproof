// R-007 delivery note present and linked, R-008 signature (human review), R-009 invoice arithmetic.
import { cents, sumLines } from "../money";
import type { PricedLine } from "../types";
import { money, moneyEn } from "./evidence";
import type { Ctx } from "./index";
import { noLines } from "./line-rules";

export function r007({ r, o, p, add, E }: Ctx) {
  const d = p.delivery;
  const note = d?.note_number || "Təhvil";
  const noteEn = d?.note_number || "the delivery note";
  if (!r.require_delivery)
    add("R-007", "NOT_APPLICABLE", {
      az: "Müştəri qaydası təhvil sənədi tələb etmir.",
      en: "The customer rule does not require a delivery note.",
    });
  else if (!d)
    add(
      "R-007",
      "FAIL",
      {
        az: `Müştəri qaydası ${r.require_signature ? "imzalanmış " : ""}təhvil sənədi tələb edir; paketdə təhvil sənədi yoxdur.`,
        en: `The customer rule requires a ${r.require_signature ? "signed " : ""}delivery note; the package has no delivery note.`,
      },
      [],
      { fix_hint: "upload_delivery" },
    );
  else if (!o)
    add(
      "R-007",
      "UNKNOWN",
      {
        az: "Sifariş təsdiqlənmədən təhvil sənədinin bağlılığı yoxlanmır.",
        en: "The delivery note link is not checked until the order is confirmed.",
      },
      [],
      { cascade: true },
    );
  else if (d.po_ref === null)
    // not in the rules table: an unread PO on the note is never "linked"
    add(
      "R-007",
      "UNKNOWN",
      {
        az: `${note} sənədində sifariş nömrəsi oxunmadı. Uyğunluq təsdiqlənməyib.`,
        en: `The order number was not read on ${noteEn}. The match is not confirmed.`,
      },
      [E("delivery", "po")],
      { fix_hint: "edit_field" },
    );
  else if (d.po_ref !== o.po_number)
    add(
      "R-007",
      "UNKNOWN",
      {
        az: `${note} sənədində sifariş: ${d.po_ref}; təsdiqlənmiş sifariş: ${o.po_number}. Uyğunluq təsdiqlənməyib.`,
        en: `Order on ${noteEn}: ${d.po_ref}; confirmed order: ${o.po_number}. The match is not confirmed.`,
      },
      [E("delivery", "po"), E("order", "po")],
      { fix_hint: "upload_delivery" },
    );
  else
    add(
      "R-007",
      "PASS",
      {
        az: `${note} paketdədir və ${o.po_number} sifarişinə bağlıdır.`,
        en: `${d.note_number || "The delivery note"} is in the package and linked to order ${o.po_number}.`,
      },
      [E("delivery", "po")],
    );
}

export function r008({ r, p, out, add, E }: Ctx) {
  const d = p.delivery;
  const r007 = out.find((c) => c.rule_id === "R-007")?.outcome;
  if (!r.require_signature)
    add("R-008", "NOT_APPLICABLE", {
      az: "Müştəri qaydası imza tələb etmir.",
      en: "The customer rule does not require a signature.",
    });
  else if (!d)
    add("R-008", "NOT_APPLICABLE", {
      az: "Təhvil sənədi olmadan imza yoxlanmır — R-007-yə baxın.",
      en: "The signature is not checked without a delivery note — see R-007.",
    });
  else if (r007 !== "PASS")
    add(
      "R-008",
      "UNKNOWN",
      {
        az: "Təhvil sənədinin uyğunluğu təsdiqlənmədən imza yoxlanmır.",
        en: "The signature is not checked until the delivery note is confirmed.",
      },
      [],
      { cascade: true },
    );
  else if (d.signed === false)
    // null = not read: a person decides, like a present signature
    add(
      "R-008",
      "FAIL",
      {
        az: "Təhvil aktında qəbul edənin imza sahəsi boşdur.",
        en: "The receiver's signature field on the delivery note is empty.",
      },
      [E("delivery", "signature")],
      { fix_hint: "upload_delivery" },
    );
  else if (!p.signature_reviewed)
    add(
      "R-008",
      "UNKNOWN",
      {
        az: "İmza tələb olunur: əməkdaş sənədə baxıb imzanın mövcudluğunu təsdiqləməlidir.",
        en: "A signature is required: a staff member must look at the document and confirm the signature is present.",
      },
      [E("delivery", "signature")],
      { fix_hint: "review_signature" },
    );
  else
    add(
      "R-008",
      "PASS",
      {
        az: "Əməkdaş imzanın vizual mövcudluğunu təsdiqləyib. Bu, imzanın hüquqi autentifikasiyası deyil.",
        en: "A staff member confirmed the signature is visually present. This is not legal authentication of the signature.",
      },
      [E("delivery", "signature")],
    );
}

export function r009(ctx: Ctx) {
  const { r, p, add, E } = ctx;
  if (noLines(ctx, "R-009")) return;
  const cur = p.currency;
  const read = p.invoice.lines.filter(
    (l): l is typeof l & PricedLine => l.qty !== null && l.unit_price !== null,
  );
  if (p.invoice.total === null || read.length !== p.invoice.lines.length) {
    // not in the rules table: arithmetic on an unread amount is never PASS
    add(
      "R-009",
      "UNKNOWN",
      {
        az: "Sətirlərin cəmi və ya yekun məbləğ oxunmadı. Mənbəyə baxıb sahəni təsdiqləyin.",
        en: "The line sum or the invoice total was not read. Check the source and confirm the field.",
      },
      [E("invoice", "total")],
      { fix_hint: "edit_field" },
    );
    return;
  }
  const sum = sumLines(read);
  const total = cents(p.invoice.total);
  const diff = sum - total;
  if (Math.abs(diff) <= cents(r.tolerance))
    add(
      "R-009",
      "PASS",
      {
        az: `Sətirlərin cəmi ${money(sum, cur)} yekun məbləğə uyğundur.`,
        en: `The line sum ${moneyEn(sum, cur)} matches the invoice total.`,
      },
      [E("invoice", "total")],
    );
  else
    add(
      "R-009",
      "FAIL",
      {
        az: `Sətirlərin cəmi ${money(sum, cur)}, fakturadakı yekun ${money(total, cur)}. Fərq: ${money(diff, cur)}.`,
        en: `The line sum is ${moneyEn(sum, cur)}, the invoice total is ${moneyEn(total, cur)}. Difference: ${moneyEn(diff, cur)}.`,
      },
      [E("invoice", "total")],
      { fix_hint: "upload_invoice" },
    );
}
