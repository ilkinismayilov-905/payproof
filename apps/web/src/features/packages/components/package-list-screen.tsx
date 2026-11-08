"use client";

import { ui } from "@payproof/api-client/i18n";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Banner, EmptyState, PageHeader } from "@/components/ui/layout";
import { SkeletonTable } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { usePackageList } from "../queries";
import { listParams, listSearch, sortFromParam, sortParam, type ListParams } from "../url";
import { packageColumns } from "./package-columns";
import { PackageFilters } from "./package-filters";

/** Filters, sort and page live in the URL: a shared link shows the same list, Back restores it. */
export function PackageListScreen() {
  const router = useRouter();
  const params = listParams(new URLSearchParams(useSearchParams().toString()));
  const list = usePackageList(params);
  // filters push (Back restores them); typing in search replaces, so history isn't one entry per key
  const go = (next: ListParams, mode: "push" | "replace" = "push") =>
    router[mode](`/packages${listSearch(next)}`, { scroll: false });

  return (
    <>
      <PageHeader
        title="Faktura paketləri"
        description="Hər paket bir fakturanı, onun sifarişini və təhvil sənədini birləşdirir. Kütləvi təsdiq P0-a daxil deyil."
      />
      <section className="bg-surface border-border shadow-1 min-w-0 rounded-lg border">
        <PackageFilters params={params} onChange={go} />
        {list.isPending && <SkeletonTable rows={6} columns={8} />}
        {list.isError && (
          <Banner
            tone="danger"
            role="alert"
            title={ui.errorTitle}
            className="m-4"
            actions={
              <Button variant="outline" onClick={() => list.refetch()}>
                {ui.retry}
              </Button>
            }
          >
            {list.error.message}
          </Banner>
        )}
        {list.data && (
          <div
            aria-busy={list.isPlaceholderData}
            className={cn(list.isPlaceholderData && "opacity-60")}
          >
            <DataTable
              caption="Faktura paketləri"
              columns={packageColumns}
              data={list.data.items}
              getRowId={(p) => p.id}
              sort={sortFromParam(params.sort)}
              // a new sort starts again from the first page
              onSortChange={(sort) => go({ ...params, sort: sortParam(sort), cursor: undefined })}
              onRowClick={(p) => router.push(`/packages/${p.id}`)}
              empty={
                <EmptyState
                  title="Heç bir paket tapılmadı"
                  description="Axtarış sözünü dəyişin və ya filtrləri təmizləyin."
                  action={
                    <Button variant="outline" onClick={() => go({ sort: params.sort })}>
                      {ui.clearFilters}
                    </Button>
                  }
                />
              }
            />
            <p className="border-border text-text-3 border-t px-4 py-3 text-xs">
              {/* no case suffix on the number: Azerbaijani suffixes depend on it (14-ü, 2-si) */}
              {`Göstərilir: ${list.data.items.length} / ${list.data.total_count} paket`}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
