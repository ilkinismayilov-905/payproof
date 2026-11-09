"use client";

import type { Schemas } from "@payproof/api-client";
import { bakuDaysBetween } from "@payproof/api-client/format";
import { dashboardText, ui } from "@payproof/api-client/i18n";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowRight, CircleCheck, Download, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DateTime, Money } from "@/components/format";
import { PackageStatusBadge, StatusBadge } from "@/components/status/status-badges";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState, Panel } from "@/components/ui/layout";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useAttentionPackages } from "@/features/packages";

type Item = Schemas["PackageListItem"];
type Approval = Schemas["Dashboard"]["recent_approvals"][number];

const More = ({ href, children }: { href: string; children: ReactNode }) => (
  <Link
    href={href}
    className="text-brand inline-flex items-center gap-1 text-sm font-semibold hover:underline pointer-coarse:min-h-11"
  >
    {children}
    <ArrowRight aria-hidden className="size-4" />
  </Link>
);

const attentionColumns = (asOf: string, t = dashboardText.attention): ColumnDef<Item>[] => [
  {
    id: "invoice",
    header: t.invoice,
    cell: ({ row: { original: p } }) => (
      <>
        <Link
          href={`/packages/${p.id}`}
          className="font-semibold hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
        >
          {p.invoice_number}
        </Link>
        <div className="text-text-3 text-xs">{p.customer.name}</div>
      </>
    ),
  },
  {
    id: "problem",
    header: t.problem,
    cell: ({ row: { original: p } }) => (
      <>
        <PackageStatusBadge status={p.status} />
        <div className="text-text-3 mt-0.5 font-mono text-xs">
          {p.blocking.map((b) => b.rule_id).join(", ")}
        </div>
      </>
    ),
  },
  {
    id: "total",
    header: t.amount,
    meta: { align: "right" },
    cell: ({ row: { original: p } }) => p.total && <Money {...p.total} />,
  },
  {
    id: "days",
    header: t.days,
    meta: { align: "right" },
    cell: ({ row: { original: p } }) => p.problem_since && bakuDaysBetween(p.problem_since, asOf),
  },
];

/** Open problems that waited longest (prototype "Diqqət tələb edən paketlər"). */
export function AttentionPackages({ asOf }: { asOf: string }) {
  const list = useAttentionPackages();
  const t = dashboardText.attention;
  return (
    <Panel title={t.title} actions={<More href="/packages">{t.all}</More>} flush>
      {list.isPending && <SkeletonTable rows={5} columns={4} />}
      {list.isError && (
        <div role="alert" className="flex items-center justify-between gap-3 px-4 pb-4">
          <span className="text-danger">{ui.errorTitle}</span>
          <Button variant="outline" onClick={() => list.refetch()}>
            {ui.retry}
          </Button>
        </div>
      )}
      {list.data && (
        <DataTable
          caption={t.title}
          columns={attentionColumns(asOf)}
          data={list.data}
          getRowId={(p) => p.id}
          empty={<EmptyState headingLevel={3} title={dashboardText.noOpenProblems} />}
        />
      )}
    </Panel>
  );
}

const validity = ({ valid, exported }: Approval, t = dashboardText.approvals) =>
  !valid
    ? { tone: "warning" as const, icon: TriangleAlert, label: t.invalidated }
    : exported
      ? { tone: "neutral" as const, icon: Download, label: t.exported }
      : { tone: "success" as const, icon: CircleCheck, label: t.valid };

/** The last approvals, bound to the package version they were given for. */
export function ApprovalHistory({ approvals }: { approvals: Approval[] }) {
  const t = dashboardText.approvals;
  return (
    <Panel title={t.title} actions={<More href="/audit">{t.audit}</More>}>
      {approvals.length ? (
        <ul>
          {approvals.map((a) => (
            <li
              key={`${a.package.id}-${a.version}`}
              className="border-border flex items-center gap-2.5 border-b py-2.5 text-sm last:border-b-0"
            >
              <div className="min-w-0 grow">
                <Link
                  href={`/packages/${a.package.id}`}
                  className="font-bold hover:underline pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center"
                >
                  {a.package.invoice_number}
                </Link>
                {` · v${a.version} · `}
                <Money {...a.total} />
                <div className="text-text-3 text-xs">
                  {a.approver.full_name} · <DateTime value={a.approved_at} />
                </div>
              </div>
              <StatusBadge {...validity(a)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-text-2">{t.none}</p>
      )}
    </Panel>
  );
}
