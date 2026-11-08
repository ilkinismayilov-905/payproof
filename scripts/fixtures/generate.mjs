// Regenerates fixtures/*.json by running the prototype's own data + rule engine in node.
// Run: pnpm fixtures:generate  (then review the diff — expected.json is golden data)
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
// synthetic: demo files have no bytes, so sha256 is taken over the file name (same name = duplicate)
const sha = (f) => crypto.createHash("sha256").update(f).digest("hex");
const TR = { ə: "a", ü: "u", ö: "o", ı: "i", ş: "sh", ç: "ch", ğ: "g" };
const email = (n) =>
  n
    .toLowerCase()
    .replace(/[əüöışçğ]/g, (c) => TR[c])
    .split(" ")
    .join(".") + "@a-distribusiya.test";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = path.join(root, "docs/product/prototype/payproof-prototype.html");
const outDir = path.join(root, "fixtures");
const src = fs.readFileSync(html, "utf8");
const body = src.slice(src.indexOf("<script>") + 8, src.indexOf("/* ---------- init"));

const noop = new Proxy(function () {}, {
  get: (t, k) => (k === Symbol.toPrimitive ? () => "" : noop),
  apply: () => noop,
});
const ctx = vm.createContext({
  document: noop,
  window: noop,
  location: { hash: "" },
  history: noop,
  console,
  structuredClone,
  Date,
  Math,
  JSON,
  Map,
  Set,
  Object,
  Array,
  String,
  Number,
  parseInt,
  Symbol,
  Proxy,
});
const expose = `;globalThis.__P = { get S(){return S}, USERS, PRODUCTS, ORDERS, PKGS, TASKS, SAMPLES, NEWSETS, COMPANY, DEMO_USERS, reset, info, memo, pk, P42, dConfirmLink, dCreateTask, STEP_T, dUpload, dReviewSig, dApprove, dExport, docTypes, curVer, addDays, nowIso, days, rulesFor, buildPkg, money };`;
vm.runInContext(body + expose, ctx);
const P = ctx.__P;

const m = (q) => {
  const neg = q < 0;
  q = Math.abs(q);
  return `${neg ? "-" : ""}${Math.trunc(q / 100)}.${String(q % 100).padStart(2, "0")}`;
};
// prototype wall-clock times are Baku local without seconds → RFC 3339 with +04:00
const iso = (k, v) =>
  typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(v) ? v + ":00+04:00" : v;
const write = (name, data) =>
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(data, iso, 2) + "\n");
const lines = (ls) => ls.map((l) => ({ product_code: l.code, qty: l.qty, unit_price: m(l.price) }));
const st = (p) => {
  P.memo.clear();
  return P.info(p);
};
const blockers = (i) => i.primary.map((c) => ({ rule_id: c.id, outcome: c.outcome }));
const outcomes = (i) => Object.fromEntries(i.checks.map((c) => [c.id, c.outcome]));

P.reset();
const S = P.S;

write("company.json", {
  id: "company_a",
  name: P.COMPANY.name,
  voen: P.COMPANY.voen,
  address: P.COMPANY.addr,
});
write(
  "users.json",
  Object.values(P.USERS).map((u) => ({
    id: u.id,
    email: email(u.name),
    full_name: u.name,
    title: u.title,
    role: u.role,
    avatar_tone: u.av,
    demo_login: P.DEMO_USERS.includes(u.id),
  })),
);
write(
  "customers.json",
  S.customers.map((c) => ({
    id: c.id,
    name: c.name,
    external_id: c.extId,
    voen: c.voen,
    requirement_sets: c.rules.map((r) => ({
      version: r.v,
      require_po: r.requirePO,
      require_delivery: r.requireDelivery,
      require_signature: r.requireSignature,
      tolerance: m(r.tol),
      effective_from: r.from,
      approved_by: r.by,
      reason: r.reason,
    })),
  })),
);
write(
  "products.json",
  Object.entries(P.PRODUCTS).map(([code, p]) => ({ code, description: p.d, unit: p.u })),
);
write(
  "orders.json",
  P.ORDERS.map(([po, c, cur, date, ls]) => ({
    po_number: po,
    customer_id: c,
    currency: cur,
    order_date: date,
    lines: lines(ls),
  })),
);

write(
  "packages.json",
  S.packages.map((p) => ({
    id: p.id,
    invoice_number: p.inv,
    customer_id: p.customerId,
    currency: p.currency,
    invoice_date: p.date,
    created_at: p.createdAt,
    owner_id: p.owner,
    version: p.version,
    processing: p.processing,
    invoice: {
      po_ref: p.invoice.poRef,
      po_raw: p.invoice.poRaw,
      unreadable_fields: p.invoice.unreadable.map(() => "po_ref"),
      total: m(p.invoice.total),
      lines: lines(p.invoice.lines),
    },
    order_link: {
      po_number: p.orderPo,
      confirmed: p.linkConfirmed,
      confirmed_by: p.linkBy,
      method: !p.linkConfirmed ? null : p.linkBy === "system" ? "exact_id" : "human",
    },
    candidates: p.candidates.map((c) => ({ po_number: c.po, reason: c.why })),
    delivery: p.delivery && {
      note_number: p.delivery.no,
      po_ref: p.delivery.poRef,
      customer_id: p.delivery.customerId,
      delivery_date: p.delivery.date,
      signed: p.delivery.signed,
      lines: p.delivery.lines.map((l) => ({ product_code: l.code, qty: l.qty })),
    },
    signature_reviewed: p.signatureReviewed,
    documents: p.docs.map((d) => ({
      type: d.type,
      versions: d.versions.map((v) => ({
        version_no: v.v,
        file_name: v.file,
        sha256: sha(v.file),
        source_kind: { PDF: "pdf", Skan: "scan", Cədvəl: "spreadsheet" }[v.src],
        uploaded_by: v.by,
        uploaded_at: v.at,
        status: v.status,
        ...(d.type === "delivery" && v.snap ? { signed: v.snap.signed } : {}),
      })),
    })),
    approvals: p.approvals.map((a) => ({
      package_version: a.version,
      requirement_set_version: a.ruleVersion,
      approver_id: a.by,
      created_at: a.at,
      valid: a.valid,
      invalidated_reason: a.valid ? null : "Təhvil sənədinin yeni versiyası yükləndi",
      invalidated_at: a.valid ? null : "2026-11-01T09:46",
    })),
    // ^ only INV-1036 has an invalidated approval; text/time come from the prototype's seeded audit event
    exports: p.exports.map((e) => ({
      package_version: e.version,
      requirement_set_version: e.ruleVersion,
      created_by: e.by,
      created_at: e.at,
      files: e.files,
    })),
  })),
);

write(
  "tasks.json",
  P.TASKS.map((t) => ({
    number: t.id,
    package_id: t.pkg,
    rule_id: t.rule,
    assignee_id: t.who,
    step: t.step,
    due_date: t.due,
    status: t.status,
    created_at: t.at,
    created_by: t.by,
    comment: t.comment ?? null,
    resolved_at: t.resolvedAt ?? null,
  })),
);
write(
  "notifications.json",
  S.notifs.map((n) => ({
    user_id: n.to,
    package_id: n.pkg,
    text: n.text,
    created_at: n.at,
    read: n.read,
  })),
);
write(
  "samples.json",
  P.SAMPLES.map((s) => ({
    id: s.id,
    package_id: s.pkg,
    type: s.type,
    file_name: s.file,
    sha256: sha(s.file),
    note: s.note,
    extraction: {
      ...(s.inv?.poRef !== undefined ? { po_ref: s.inv.poRef } : {}),
      ...(s.inv?.currency ? { currency: s.inv.currency } : {}),
      ...(s.line
        ? {
            line: {
              product_code: s.line.code,
              ...(s.line.price ? { unit_price: s.line.price } : {}),
              ...(s.line.qty != null ? { qty: s.line.qty } : {}),
            },
          }
        : {}),
      ...(s.dl
        ? { delivery: { note_number: s.dl.no, po_ref: s.dl.po, signed: s.dl.signed !== false } }
        : {}),
    },
  })),
);
