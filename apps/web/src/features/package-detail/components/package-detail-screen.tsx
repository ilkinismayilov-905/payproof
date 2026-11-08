"use client";

import type { Schemas } from "@payproof/api-client";
import { ui } from "@payproof/api-client/i18n";
import { PackageX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState, Panel } from "@/components/ui/layout";
import { Loading, SkeletonBar } from "@/components/ui/skeleton";
import { usePackage } from "../queries";
import { detailText as t } from "../texts";
import { ActivityPanel } from "./activity-panel";
import { ComparisonPanel } from "./comparison-panel";
import { DocumentsPanel } from "./documents-panel";
import { EvidenceViewer } from "./evidence-viewer";
import { MatchBanner } from "./match-banner";
import { PackageActions } from "./package-actions";
import { PackageHeader } from "./package-header";
import { ReadinessBanner } from "./readiness-banner";

export function PackageDetailScreen({ id }: { id: string }) {
  const pkg = usePackage(id);
  const [viewing, setViewing] = useState<{ evidence: Schemas["Evidence"]; label: string } | null>(
    null,
  );

  if (pkg.isPending)
    return (
      <Loading className="flex flex-col gap-4">
        <SkeletonBar className="h-4 w-48" />
        <SkeletonBar className="h-10 w-80" />
        <SkeletonBar className="h-20 w-full rounded-lg" />
        <SkeletonBar className="h-64 w-full rounded-lg" />
      </Loading>
    );
  if (pkg.isError)
    return pkg.error.status === 404 ? (
      <EmptyState
        icon={PackageX}
        title={t.notFoundTitle}
        description={t.notFoundBody}
        action={
          <Button asChild variant="outline">
            <Link href="/packages">{t.backToList}</Link>
          </Button>
        }
      />
    ) : (
      <Banner
        tone="danger"
        role="alert"
        title={ui.errorTitle}
        actions={
          <Button variant="outline" onClick={() => pkg.refetch()}>
            {ui.retry}
          </Button>
        }
      >
        {pkg.error.message}
      </Banner>
    );

  return (
    <div className="@container flex flex-col gap-4">
      <PackageHeader pkg={pkg.data} actions={<PackageActions status={pkg.data.status} />} />
      <ReadinessBanner pkg={pkg.data} onRefresh={() => pkg.refetch()} />
      <MatchBanner pkg={pkg.data} />
      {/* while processing nothing is shown yet (prototype) */}
      {pkg.data.status !== "PROCESSING" && (
        // prototype .pd-grid: 1 column → compare|checks over docs|checks (880 px) → docs|compare|checks (1240 px)
        <div className="grid items-start gap-4 [grid-template-areas:'checks'_'compare'_'docs'] @min-[880px]:grid-cols-[minmax(0,1fr)_360px] @min-[880px]:[grid-template-areas:'compare_checks'_'docs_checks'] @min-[1240px]:grid-cols-[250px_minmax(0,1fr)_360px] @min-[1240px]:[grid-template-areas:'docs_compare_checks']">
          <DocumentsPanel pkg={pkg.data} />
          {/* placeholder until W-10 fills the checks area */}
          <ComparisonPanel
            pkg={pkg.data}
            onEvidence={(evidence, label) => setViewing({ evidence, label })}
          />
          <Panel title={t.checks} className="[grid-area:checks]">
            <p className="text-text-3 text-sm">{t.soon}</p>
          </Panel>
        </div>
      )}
      <EvidenceViewer
        pkg={pkg.data}
        evidence={viewing?.evidence ?? null}
        label={viewing?.label ?? ""}
        onClose={() => setViewing(null)}
      />
      <ActivityPanel
        packageId={id}
        // prototype: only a package that was never approved or exported can be deleted
        canDelete={
          pkg.data.permissions.can_delete && !pkg.data.approvals.length && !pkg.data.exports.length
        }
      />
    </div>
  );
}
