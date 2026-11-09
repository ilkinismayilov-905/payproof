import type { Schemas } from "@payproof/api-client";
import { packagesText, ruleLabel } from "@payproof/api-client/i18n";
import type { ColumnDef } from "@tanstack/react-table";
import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { DateTime, Money } from "@/components/format";
import { PackageStatusBadge } from "@/components/status/status-badges";

type Item = Schemas["PackageListItem"];
const sortable = { enableSorting: true } as const; // ids below are the API `sort` keys

const t = () => packagesText.columns;
const poNote = (p: Item) => p.po_ref ?? (p.po_unreadable ? t().poUnreadable : t().poMissing);

/** A function, not a constant: headers are read in the current language at render. */
export const packageColumns = (): ColumnDef<Item>[] => [
  {
    id: "invoice_number",
    header: t().invoice,
    ...sortable,
    cell: ({ row: { original: p } }) => (
      <>
        <Link
          href={`/packages/${p.id}`}
          className="font-semibold hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          {p.invoice_number ?? t().processing}
        </Link>
        <div className="text-text-3 text-xs">{`v${p.version} · ${poNote(p)}`}</div>
      </>
    ),
  },
  {
    id: "customer",
    header: t().customer,
    ...sortable,
    cell: ({ row }) => row.original.customer.name,
  },
  {
    id: "invoice_date",
    header: t().date,
    ...sortable,
    cell: ({ row }) =>
      row.original.invoice_date && <DateTime value={row.original.invoice_date} format="date" />,
  },
  {
    id: "total",
    header: t().amount,
    ...sortable,
    meta: { align: "right" },
    cell: ({ row }) =>
      row.original.total && <Money {...row.original.total} className="font-semibold" />,
  },
  {
    id: "status",
    header: t().status,
    ...sortable,
    cell: ({ row }) => <PackageStatusBadge status={row.original.status} />,
  },
  {
    id: "blocking",
    header: t().blocking,
    ...sortable,
    cell: ({ row: { original: p } }) =>
      p.blocking.length ? (
        <span
          className="text-danger inline-flex items-center gap-1 font-bold"
          title={p.blocking.map((b) => `${b.rule_id} ${ruleLabel(b.rule_id)}`).join("; ")}
        >
          <TriangleAlert aria-hidden className="size-[15px]" />
          {p.blocking.length}
          <span className="sr-only">
            {t().blockingSr(p.blocking.map((b) => b.rule_id).join(", "))}
          </span>
        </span>
      ) : (
        <span className="text-text-3">—</span>
      ),
  },
  {
    id: "owner",
    header: t().owner,
    ...sortable,
    cell: ({ row }) => <span className="text-sm">{row.original.owner.full_name}</span>,
  },
  {
    id: "updated_at",
    header: t().updated,
    ...sortable,
    cell: ({ row }) => <DateTime value={row.original.updated_at} className="text-text-3 text-sm" />,
  },
];
