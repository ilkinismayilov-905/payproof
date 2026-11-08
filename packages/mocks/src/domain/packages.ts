// Create (from a demo document set), finish processing (exact-ID link), soft delete.
import { documentTypeLabel } from "@payproof/api-client/i18n";
import { decimal, sumLines } from "../money";
import type { MockDb } from "../store";
import type { Pkg } from "../types";
import { log, MockError } from "./audit";
import { sha256, sourceKind } from "./upload";
import { validate } from "./validate";

export interface CreateInput {
  customer_id: string;
  owner_id: string;
  /** Uploaded file names in invoice, order, delivery order. */
  files: string[];
}

const TYPES = ["invoice", "order", "delivery"] as const;

export async function createPackage(db: MockDb, input: CreateInput, actor: string): Promise<Pkg> {
  const set = db.newsets.find(
    (n) => n.files[0] === input.files[0] && n.customer_id === input.customer_id,
  );
  if (!set)
    throw new MockError(
      "VALIDATION_ERROR",
      `Mock rejimində yalnız demo dəstləri tanınır: ${db.newsets.map((n) => n.files[0]).join(", ")}.`,
      422,
    );
  if (
    db.packages.some(
      (p) =>
        !p.deleted && p.customer_id === set.customer_id && p.invoice_number === set.invoice_number,
    )
  )
    throw new MockError(
      "DUPLICATE_INVOICE",
      `${set.invoice_number} bu müştəri üçün artıq mövcuddur.`,
      409,
    );
  const at = db.tick();
  const files = input.files.slice(0, set.delivery ? 3 : 2);
  const p: Pkg = {
    id: `pkg_${set.invoice_number.slice(4)}`,
    invoice_number: set.invoice_number,
    customer_id: set.customer_id,
    currency: set.currency as Pkg["currency"],
    invoice_date: set.invoice_date,
    created_at: at,
    updated_at: at,
    owner_id: input.owner_id,
    version: 1,
    processing: true,
    invoice: {
      po_ref: set.po_number,
      po_raw: null,
      unreadable_fields: [],
      total: decimal(sumLines(set.lines)),
      lines: structuredClone(set.lines),
    },
    order_link: { po_number: null, confirmed: false, confirmed_by: null, method: null },
    candidates: [],
    delivery: set.delivery && {
      note_number: set.delivery.note_number,
      po_ref: set.delivery.po_ref,
      customer_id: set.customer_id,
      delivery_date: set.invoice_date,
      signed: true,
      lines: set.lines.map((l) => ({ product_code: l.product_code, qty: l.qty })),
    },
    signature_reviewed: false,
    documents: await Promise.all(
      files.map(async (file_name, i) => ({
        type: TYPES[i]!,
        versions: [
          {
            version_no: 1,
            file_name,
            sha256: await sha256(file_name),
            source_kind: sourceKind(file_name),
            uploaded_by: actor,
            uploaded_at: at,
            status: "PROCESSING" as const,
            package_version_at_upload: 1,
          },
        ],
      })),
    ),
    approvals: [],
    exports: [],
    problem_since: null,
    last_status: null,
  };
  db.packages.unshift(p);
  log(db, {
    actor,
    action: "package.created",
    message: `${p.invoice_number} · ${db.customer(p.customer_id).name}`,
    pkg: p.id,
    at,
  });
  for (const d of p.documents)
    log(db, {
      actor,
      action: "document.uploaded",
      message: `${documentTypeLabel[d.type]}: ${d.versions[0]!.file_name} (sənəd v1)`,
      pkg: p.id,
      objectType: "document_version",
      at,
    });
  return p;
}

/** Extraction finished (job done): fields are ready; an exact PO of the same customer links automatically. */
export function finishProcessing(db: MockDb, p: Pkg) {
  if (!p.processing) return;
  p.processing = false;
  for (const d of p.documents)
    for (const v of d.versions) if (v.status === "PROCESSING") v.status = "EXTRACTED";
  log(db, {
    actor: "system",
    action: "document.extracted",
    message: "Sahələr və mənbə istinadları çıxarıldı (əvvəlcədən hazırlanmış nəticə)",
    pkg: p.id,
  });
  const po = p.invoice.po_ref;
  if (po && db.orders[po]?.customer_id === p.customer_id) {
    p.order_link = { po_number: po, confirmed: true, confirmed_by: "system", method: "exact_id" };
    log(db, {
      actor: "system",
      action: "link.exact_match",
      message: `${po} · üsul: təsdiqlənmiş ID`,
      pkg: p.id,
      objectType: "order_link",
    });
  }
  validate(db, p);
}
