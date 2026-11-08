// Validates fixtures/*.json against fixtures/schema/*.json plus cross-file invariants.
// Run: pnpm fixtures:check
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const dir = path.dirname(fileURLToPath(import.meta.url));
const read = (p) => JSON.parse(fs.readFileSync(path.join(dir, p), "utf8"));
const FILES = [
  "company",
  "users",
  "customers",
  "products",
  "orders",
  "packages",
  "tasks",
  "notifications",
  "samples",
  "newsets",
  "expected",
];

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(read("schema/defs.json"));
const errors = [];
const fail = (msg) => errors.push(msg);

const data = {};
for (const name of FILES) {
  data[name] = read(`${name}.json`);
  const validate = ajv.compile(read(`schema/${name}.json`));
  if (!validate(data[name]))
    for (const e of validate.errors) fail(`${name}.json${e.instancePath}: ${e.message}`);
}
const {
  users,
  customers,
  products,
  orders,
  packages,
  tasks,
  notifications,
  samples,
  newsets,
  expected,
} = data;

// Money in integer cents — never float.
const cents = (s) => {
  const [int, frac] = s.replace("-", "").split(".");
  return (s.startsWith("-") ? -1n : 1n) * (BigInt(int) * 100n + BigInt(frac));
};
const fromCents = (c) =>
  `${c < 0n ? "-" : ""}${(c < 0n ? -c : c) / 100n}.${String((c < 0n ? -c : c) % 100n).padStart(2, "0")}`;
const lineSum = (lines) => lines.reduce((a, l) => a + BigInt(l.qty) * cents(l.unit_price), 0n);

// Counts
const actual = {
  packages: packages.length,
  orders: orders.length,
  customers: customers.length,
  users: users.length,
  products: products.length,
  tasks: tasks.length,
  samples: samples.length,
  newsets: newsets.length,
};
for (const [k, n] of Object.entries(expected.counts))
  if (actual[k] !== n) fail(`count ${k}: expected ${n}, got ${actual[k]}`);

// Referential integrity
const ids = (arr, key) => new Set(arr.map((x) => x[key]));
const userIds = ids(users, "id"),
  customerIds = ids(customers, "id"),
  codes = ids(products, "code"),
  pos = ids(orders, "po_number"),
  pkgIds = ids(packages, "id");
const ref = (set, v, where) =>
  v != null && v !== "system" && !set.has(v) && fail(`${where}: unknown reference ${v}`);
const unique = (arr, key, file) =>
  arr.length !== ids(arr, key).size && fail(`${file}: duplicate ${key}`);
unique(users, "id", "users");
unique(customers, "id", "customers");
unique(products, "code", "products");
unique(orders, "po_number", "orders");
unique(packages, "id", "packages");
unique(packages, "invoice_number", "packages");
unique(tasks, "number", "tasks");

for (const c of customers) {
  c.requirement_sets.forEach((r, i) => {
    if (r.version !== i + 1) fail(`${c.id}: requirement set versions must be 1..n`);
    ref(userIds, r.approved_by, `${c.id} rules v${r.version}`);
  });
}
for (const o of orders) {
  ref(customerIds, o.customer_id, o.po_number);
  o.lines.forEach((l) => ref(codes, l.product_code, o.po_number));
}
for (const p of packages) {
  const w = p.invoice_number;
  ref(customerIds, p.customer_id, w);
  ref(userIds, p.owner_id, w);
  p.invoice.lines.forEach((l) => ref(codes, l.product_code, w));
  ref(pos, p.order_link.po_number, `${w} order_link`);
  ref(userIds, p.order_link.confirmed_by, `${w} order_link`);
  if (p.order_link.confirmed !== (p.order_link.method !== null))
    fail(`${w}: link method must be set iff confirmed`);
  p.candidates.forEach((c) => ref(pos, c.po_number, `${w} candidate`));
  if (p.delivery) {
    ref(pos, p.delivery.po_ref, `${w} delivery`);
    ref(customerIds, p.delivery.customer_id, `${w} delivery`);
  }
  if (cents(p.invoice.total) !== lineSum(p.invoice.lines))
    fail(
      `${w}: invoice total ${p.invoice.total} != sum of lines ${fromCents(lineSum(p.invoice.lines))}`,
    );
  for (const d of p.documents)
    d.versions.forEach((v, i) => {
      if (v.version_no !== i + 1) fail(`${w} ${d.type}: version_no must be 1..n`);
      ref(userIds, v.uploaded_by, w);
    });
  const validApprovals = p.approvals.filter((a) => a.valid);
  if (validApprovals.some((a) => a.package_version !== p.version))
    fail(`${w}: a valid approval must be for the current version`);
  for (const a of p.approvals)
    if (a.valid === (a.invalidated_reason !== null))
      fail(`${w}: invalidated_reason must be set iff approval is invalid`);
  for (const e of p.exports)
    if (!p.approvals.some((a) => a.valid && a.package_version === e.package_version))
      fail(`${w}: export without a valid approval for v${e.package_version}`);
}
for (const t of tasks) {
  ref(pkgIds, t.package_id, t.number);
  ref(userIds, t.assignee_id, t.number);
  ref(userIds, t.created_by, t.number);
}
for (const n of notifications) {
  ref(pkgIds, n.package_id, "notification");
  ref(userIds, n.user_id, "notification");
}
for (const s of samples) {
  ref(pkgIds, s.package_id, s.id);
  if (s.extraction.line) ref(codes, s.extraction.line.product_code, s.id);
}
for (const n of newsets) {
  ref(customerIds, n.customer_id, n.id);
  ref(pos, n.po_number, n.id);
  n.lines.forEach((l) => ref(codes, l.product_code, n.id));
}

// expected.json ↔ packages
const byInv = new Map(packages.map((p) => [p.invoice_number, p]));
if (Object.keys(expected.packages).sort().join() !== [...byInv.keys()].sort().join())
  fail("expected.packages must list exactly the fixture packages");
for (const [inv, e] of Object.entries(expected.packages)) {
  const p = byInv.get(inv);
  if (!p) continue;
  if (e.package_id !== p.id || e.version !== p.version)
    fail(`${inv}: expected package_id/version disagree with packages.json`);
  for (const b of e.blockers)
    if (e.checks[b.rule_id] !== b.outcome)
      fail(`${inv}: blocker ${b.rule_id} disagrees with checks`);
}

// Dashboard: open problem amounts per currency (never mixed)
const open = new Map();
for (const [inv, e] of Object.entries(expected.packages)) {
  if (e.status !== "NEEDS_FIX" && e.status !== "NEEDS_REVIEW") continue;
  const p = byInv.get(inv);
  const cur = open.get(p.currency) ?? { amount: 0n, packages: 0 };
  open.set(p.currency, { amount: cur.amount + cents(p.invoice.total), packages: cur.packages + 1 });
}
for (const x of expected.dashboard.open_problem_amounts) {
  const got = open.get(x.currency);
  if (!got || fromCents(got.amount) !== x.amount || got.packages !== x.packages)
    fail(
      `dashboard ${x.currency}: expected ${x.amount}/${x.packages}, recomputed ${got && fromCents(got.amount)}/${got?.packages}`,
    );
}

// expected.json ↔ docs/product/demo-dataset.md package table
const md = fs.readFileSync(path.join(dir, "../docs/product/demo-dataset.md"), "utf8");
const rows = [
  ...md.matchAll(/^\| (INV-\d+) \| (c\d) \| ([\d.,]+) (AZN|USD) \| ([A-Z_]+) \| ([^|]*) \|/gm),
];
if (rows.length !== packages.length)
  fail(`demo-dataset.md: expected ${packages.length} package rows, found ${rows.length}`);
for (const [, inv, cust, amount, cur, status, blockersCol] of rows) {
  const p = byInv.get(inv),
    e = expected.packages[inv];
  if (!p || !e) {
    fail(`demo-dataset.md: ${inv} not in fixtures`);
    continue;
  }
  if (
    p.customer_id !== cust ||
    p.currency !== cur ||
    p.invoice.total !== amount.replaceAll(".", "").replace(",", ".")
  )
    fail(`${inv}: customer/amount differs from demo-dataset.md`);
  if (e.status !== status) fail(`${inv}: status ${e.status} != demo-dataset.md ${status}`);
  const mdBlockers = [...blockersCol.matchAll(/(R-\d{3}) (FAIL|UNKNOWN)/g)]
    .map((m) => `${m[1]} ${m[2]}`)
    .join();
  if (mdBlockers !== e.blockers.map((b) => `${b.rule_id} ${b.outcome}`).join())
    fail(
      `${inv}: blockers [${e.blockers.map((b) => b.rule_id)}] != demo-dataset.md [${mdBlockers}]`,
    );
}

if (errors.length) {
  console.error(`✗ fixtures:check — ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
console.log(
  `✓ fixtures:check — ${FILES.length} files valid, ${packages.length} packages match expected.json and demo-dataset.md`,
);
