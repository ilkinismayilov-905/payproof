// R-001 PO present, R-002 PO matches the confirmed order.
import type { Ctx } from "./index";

export function r001({ r, p, poUnread, add, E }: Ctx) {
  const po = p.invoice.po_ref;
  if (!r.require_po)
    add("R-001", "NOT_APPLICABLE", {
      az: "Müştəri qaydası sifariş nömrəsini tələb etmir.",
      en: "The customer rule does not require an order number.",
    });
  else if (poUnread)
    add(
      "R-001",
      "UNKNOWN",
      {
        az: "PO sahəsi skanda oxunmadı. Mənbəyə baxıb sahəni təsdiqləyin və ya müştəridən aydın nüsxə istəyin.",
        en: "The PO field was not read on the scan. Check the source and confirm the field or ask the customer for a clear copy.",
      },
      [E("invoice", "po")],
      { fix_hint: "edit_field" },
    );
  else if (!po)
    add(
      "R-001",
      "FAIL",
      {
        az: "Müştəri qaydası fakturada sifariş nömrəsi tələb edir, fakturada isə PO göstərilməyib.",
        en: "The customer rule requires an order number on the invoice, but the invoice shows no PO.",
      },
      [E("invoice", "po")],
      { fix_hint: "upload_invoice" },
    );
  else
    add(
      "R-001",
      "PASS",
      {
        az: `Fakturada sifariş nömrəsi var: ${po}.`,
        en: `The invoice has an order number: ${po}.`,
      },
      [E("invoice", "po")],
    );
}

export function r002({ o, p, poUnread, add, E }: Ctx) {
  const po = p.invoice.po_ref;
  if (!o) {
    const n = p.candidates.length;
    add(
      "R-002",
      "UNKNOWN",
      n > 1
        ? {
            az: `${n} mümkün sifariş tapıldı — düzgün sifarişi insan seçməlidir.`,
            en: `${n} possible orders found — a person must choose the right one.`,
          }
        : {
            az: "Təklif olunan sifariş əlaqəsi hələ insan tərəfindən təsdiqlənməyib.",
            en: "The suggested order link has not been confirmed by a person yet.",
          },
      [],
      { fix_hint: "link_order" },
    );
  } else if (poUnread)
    add(
      "R-002",
      "UNKNOWN",
      {
        az: "Fakturadakı PO oxunmadığı üçün müqayisə aparılmır.",
        en: "The invoice PO was not read, so no comparison is made.",
      },
      [],
      { cascade: true },
    );
  else if (!po)
    add("R-002", "NOT_APPLICABLE", {
      az: "Fakturada PO yoxdur — R-001-ə baxın.",
      en: "The invoice has no PO — see R-001.",
    });
  else if (po !== o.po_number)
    add(
      "R-002",
      "FAIL",
      {
        az: `Fakturadakı ${po} təsdiqlənmiş sifarişə (${o.po_number}) uyğun deyil.`,
        en: `${po} on the invoice does not match the confirmed order (${o.po_number}).`,
      },
      [E("invoice", "po"), E("order", "po")],
      { fix_hint: "upload_invoice" },
    );
  else
    add(
      "R-002",
      "PASS",
      { az: `${po} təsdiqlənmiş sifarişə uyğundur.`, en: `${po} matches the confirmed order.` },
      [E("invoice", "po"), E("order", "po")],
    );
}
