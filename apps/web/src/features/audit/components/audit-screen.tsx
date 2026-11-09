"use client";

import { auditText as t, ui } from "@payproof/api-client/i18n";
import { useMutation } from "@tanstack/react-query";
import { Download, History } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Banner, EmptyState, PageHeader } from "@/components/ui/layout";
import { SearchBox } from "@/components/ui/search-box";
import { SkeletonTable } from "@/components/ui/skeleton";
import { useUsers } from "@/features/users";
import { saveFile } from "@/lib/download";
import { cn } from "@/lib/utils";
import { auditCsv, auditFilter, useAudit, type AuditFilter } from "../queries";
import { auditColumns } from "./audit-columns";

/** Company-wide, append-only audit log; search and user filter live in the URL. */
export function AuditScreen() {
  const router = useRouter();
  const filter = auditFilter(new URLSearchParams(useSearchParams().toString()));
  const audit = useAudit(filter);
  const users = useUsers();
  // typing replaces the entry (no history step per key); the user filter pushes one
  const go = (next: AuditFilter, mode: "push" | "replace" = "push") => {
    const q = new URLSearchParams();
    if (next.q) q.set("q", next.q);
    if (next.actor) q.set("actor", next.actor);
    router[mode](`/audit${q.size ? `?${q}` : ""}`, { scroll: false });
  };
  const csv = useMutation({
    mutationFn: async () => {
      // BOM: spreadsheet apps then read the Azerbaijani letters as UTF-8
      const text = await auditCsv(filter);
      await saveFile("Prefly_audit.csv", new Blob(["﻿", text], { type: "text/csv" }));
      toast.success(t.csvDone);
    },
  });
  const items = audit.data?.items;

  return (
    <>
      <PageHeader
        title={t.title}
        description={t.description}
        actions={
          <Button
            variant="outline"
            size="lg"
            aria-disabled={csv.isPending}
            onClick={() => csv.isPending || csv.mutate()}
          >
            <Download aria-hidden />
            {t.csv}
          </Button>
        }
      />
      <section className="bg-surface border-border shadow-1 min-w-0 rounded-lg border">
        <div className="border-border flex flex-wrap items-center gap-3 border-b p-3">
          <SearchBox
            label={t.searchLabel}
            placeholder={t.searchPlaceholder}
            value={filter.q}
            onSearch={(q) => go({ ...filter, q }, "replace")}
            className="min-w-60 grow"
          />
          <label className="text-sm">
            <span className="sr-only">{t.user}</span>
            <select
              value={filter.actor}
              onChange={(e) => go({ ...filter, actor: e.target.value })}
              className="border-border-strong bg-surface focus-visible:ring-ring rounded-md border px-3 py-1.5 outline-none focus-visible:ring-2 pointer-coarse:min-h-11"
            >
              <option value="">{t.userAll}</option>
              <option value="system">{ui.system}</option>
              {users.data?.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {audit.isPending && <SkeletonTable rows={8} columns={4} />}
        {audit.isError && (
          <Banner
            tone="danger"
            role="alert"
            title={ui.errorTitle}
            className="m-4"
            actions={
              <Button variant="outline" onClick={() => audit.refetch()}>
                {ui.retry}
              </Button>
            }
          >
            {audit.error.message}
          </Banner>
        )}
        {items && (
          <div
            aria-busy={audit.isPlaceholderData}
            className={cn(audit.isPlaceholderData && "opacity-60")}
          >
            <DataTable
              caption={t.caption}
              columns={auditColumns()}
              data={items}
              getRowId={(e) => e.id}
              empty={
                <EmptyState icon={History} title={t.emptyTitle} description={t.emptyDescription} />
              }
            />
            <p className="text-text-3 border-border border-t px-4 py-2 text-xs">
              {t.footer(items.length, Boolean(audit.data?.next_cursor))}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
