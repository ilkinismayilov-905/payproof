"use client";

import type { Schemas } from "@payproof/api-client";
import { actionLabel, approvalText as t, ui } from "@payproof/api-client/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { packageKeys } from "@/features/packages";
import { exportDownload, internalReport, saveFile } from "../approval";
import { ApproveDialog } from "./approve-dialog";
import { ExportDialog } from "./export-dialog";
import type { ApprovalActions } from "./package-actions";

type Pkg = Schemas["PackageDetail"];

/**
 * Approve, export, manifest and report for one package: the header's actions plus the dialogs
 * they open. A 409 from either dialog becomes the "Paket yenilənib" dialog.
 */
export function useApprovalFlow(pkg: Pkg | undefined) {
  const client = useQueryClient();
  const [open, setOpen] = useState<"approve" | "export" | "conflict" | null>(null);
  // one-off downloads: errors go through the global toast like any mutation
  const download = useMutation({
    mutationFn: async (kind: "manifest" | "report") => {
      if (!pkg) return;
      const name = `Prefly_${pkg.invoice_number}_v${pkg.version}`;
      if (kind === "report") {
        await saveFile(`${name}_${t.reportFile}.json`, await internalReport(pkg.id));
        return toast.success(t.reportSaved);
      }
      const record = pkg.exports.find((e) => e.package_version === pkg.version);
      if (!record) return toast.warning(t.noExportFor(pkg.version));
      await saveFile(`${name}.zip`, (await exportDownload(record.id)).url);
      toast.info(t.manifestAgain(pkg.version));
    },
  });

  const actions: ApprovalActions = {
    onApprove: pkg?.permissions.can_approve ? () => setOpen("approve") : undefined,
    onExport: pkg?.permissions.can_export ? () => setOpen("export") : undefined,
    onReExport: () => download.mutate("manifest"),
    onReport: () => download.mutate("report"),
    pending: download.isPending,
  };
  const close = (o: boolean) => o || setOpen(null);
  const conflict = () => setOpen("conflict");

  const dialogs = pkg && (
    <>
      {open === "approve" && (
        <ApproveDialog pkg={pkg} open onOpenChange={close} onConflict={conflict} />
      )}
      {open === "export" && (
        <ExportDialog pkg={pkg} open onOpenChange={close} onConflict={conflict} />
      )}
      <ConfirmDialog
        open={open === "conflict"}
        onOpenChange={close}
        destructive={false}
        title={ui.versionConflictTitle}
        description={t.conflictBody}
        confirmLabel={actionLabel.refresh}
        onConfirm={() => client.invalidateQueries({ queryKey: packageKeys.detail(pkg.id) })}
      />
    </>
  );
  return { actions, dialogs };
}
