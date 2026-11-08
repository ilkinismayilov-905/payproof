import type { Schemas } from "@payproof/api-client";
import { actionLabel } from "@payproof/api-client/i18n";
import { Check, Download, Lock, RefreshCw, Upload, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { detailText as t } from "../texts";

// Inert, not `disabled`: it stays focusable, so the reason (title → description) can be read.
const Inert = ({
  icon: Icon,
  label,
  reason,
  primary = false,
}: {
  icon: LucideIcon;
  label: string;
  reason: string;
  primary?: boolean;
}) => (
  <Button
    variant={primary ? "default" : "outline"}
    size="lg"
    aria-disabled="true"
    title={reason}
    onClick={(e) => e.preventDefault()}
    className="aria-disabled:cursor-not-allowed aria-disabled:opacity-60"
  >
    <Icon aria-hidden />
    {label}
  </Button>
);

/**
 * Header actions by status (prototype `pgPackage`). Re-check (W-10), upload (W-11) and
 * approve/export (W-13) arrive in later steps; until then they are inert and say so.
 */
export function PackageActions({ status }: { status: Schemas["PackageStatus"] }) {
  const primary =
    status === "READY_FOR_APPROVAL" ? (
      <Inert primary icon={Check} label={actionLabel.confirm} reason={t.soon} />
    ) : status === "APPROVED_READY" ? (
      <Inert primary icon={Download} label={t.export} reason={t.soon} />
    ) : status === "EXPORTED" ? (
      <Inert icon={Download} label={t.reExport} reason={t.soon} />
    ) : (
      <Inert
        primary
        icon={Lock}
        label={actionLabel.confirm}
        reason={status === "PROCESSING" ? t.stillProcessing : t.blocked}
      />
    );
  return (
    <>
      <Inert icon={RefreshCw} label={t.recheck} reason={t.soon} />
      <Inert icon={Upload} label={t.upload} reason={t.soon} />
      {primary}
    </>
  );
}
