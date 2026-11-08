"use client";

import { ui } from "@payproof/api-client/i18n";
import { PackageX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Banner, EmptyState } from "@/components/ui/layout";
import { Loading, SkeletonBar } from "@/components/ui/skeleton";
import { usePackage } from "../queries";
import { detailText as t } from "../texts";
import { PackageActions } from "./package-actions";
import { PackageHeader } from "./package-header";

export function PackageDetailScreen({ id }: { id: string }) {
  const pkg = usePackage(id);

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
    </div>
  );
}
