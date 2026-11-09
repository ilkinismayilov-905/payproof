"use client";

import type { Schemas } from "@payproof/api-client";
import {
  actionLabel,
  correctionText as t,
  detailText,
  packageStatusLabel,
} from "@payproof/api-client/i18n";
import { Upload } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog } from "radix-ui";
import { useId, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRestoreFocus } from "@/components/ui/restore-focus";
import { packageKeys } from "@/features/packages";
import { StaleBanner, usePackageChangedSince } from "@/lib/stale";
import { useCorrectField } from "../mutations";
import { PaperPage } from "./paper-page";
import { SourceFile } from "./source-file";

type Pkg = Schemas["PackageDetail"];
type Field = Schemas["ExtractedField"];

/** What a valid new value looks like for this field (money and quantities stay decimal strings). */
function invalidValue(path: string, value: string): string | null {
  if (!value.trim()) return t.valueRequired;
  if (path.endsWith(".unit_price") && !/^\d+(\.\d{1,2})?$/.test(value)) return t.amountFormat;
  if (path.endsWith(".qty") && !/^\d+(\.\d{1,3})?$/.test(value)) return t.qtyFormat;
  return null;
}

interface Props {
  pkg: Pkg;
  field: Field;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The document itself is wrong: replace it with a corrected version instead. */
  onUploadInstead: () => void;
}

/** Fix an extracted value by looking at its source; the document does not change, the reason is audited. */
export function CorrectFieldDialog({ pkg, field, open, onOpenChange, onUploadInstead }: Props) {
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [shown, setShown] = useState(false); // show errors only after a submit attempt
  const correct = useCorrectField(pkg.id);
  const focus = useRestoreFocus();
  const client = useQueryClient();
  const changed = usePackageChangedSince(pkg.id, pkg.version);
  const ids = { value: useId(), reason: useId() };
  const valueError = invalidValue(field.field_path, value);
  const reasonError = reason.trim().length < 3 ? t.reasonShort : null;
  const evidence = field.evidence;
  const version = pkg.documents
    .flatMap((d) => [d.current, ...d.history])
    .find((v) => v.id === evidence?.document_version_id);
  const docType = pkg.documents.find(
    (d) => d.current.id === version?.id || d.history.some((h) => h.id === version?.id),
  )?.type;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setShown(true);
    if (valueError || reasonError || correct.isPending) return;
    correct.mutate(
      {
        fieldId: field.id,
        value: value.trim(),
        reason: reason.trim(),
        expected_version: pkg.version,
      },
      {
        onSuccess: (next) => {
          onOpenChange(false);
          toast.success(
            `${t.corrected(field.label)} ${detailText.rechecked(next.version, packageStatusLabel[next.status])}`,
          );
        },
      },
    );
  };

  const input =
    "border-border-strong bg-surface focus-visible:ring-ring w-full rounded-md border px-3 py-2 outline-none focus-visible:ring-2 aria-invalid:border-danger";
  return (
    <Dialog.Root open={open} onOpenChange={(o) => correct.isPending || onOpenChange(o)}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay fixed inset-0 z-50" />
        <Dialog.Content
          {...focus}
          className="bg-surface border-border shadow-3 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[min(760px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border"
        >
          <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
            <div className="px-6 pt-5 pb-3">
              <Dialog.Title className="text-xl font-semibold">{t.title(field.label)}</Dialog.Title>
              <Dialog.Description className="text-text-2 text-sm">
                {t.description}
              </Dialog.Description>
            </div>
            <div className="flex flex-col gap-3 overflow-auto px-6 pb-4">
              {changed && (
                <StaleBanner
                  version={changed}
                  onRefresh={() =>
                    void client.invalidateQueries({ queryKey: packageKeys.detail(pkg.id) })
                  }
                />
              )}
              <p className="text-sm">{t.readValue(field.raw_value ?? detailText.notRead)}</p>
              {evidence &&
                version &&
                docType &&
                (process.env.NEXT_PUBLIC_API_MOCK === "1" ? (
                  <PaperPage pkg={pkg} version={version} docType={docType} evidence={evidence} />
                ) : (
                  <SourceFile
                    versionId={version.id}
                    fileName={version.file_name}
                    page={evidence.page}
                    bbox={evidence.bbox}
                  />
                ))}
              <label htmlFor={ids.value} className="text-sm font-semibold">
                {t.newValue}
              </label>
              <input
                id={ids.value}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                inputMode={field.field_path.endsWith(".po_ref") ? "text" : "decimal"}
                aria-invalid={(shown && Boolean(valueError)) || undefined}
                aria-describedby={shown && valueError ? `${ids.value}-err` : undefined}
                className={input}
              />
              {shown && valueError && (
                <p id={`${ids.value}-err`} className="text-danger text-sm">
                  {valueError}
                </p>
              )}
              <label htmlFor={ids.reason} className="text-sm font-semibold">
                {t.reason}
              </label>
              <textarea
                id={ids.reason}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                rows={2}
                aria-invalid={(shown && Boolean(reasonError)) || undefined}
                aria-describedby={shown && reasonError ? `${ids.reason}-err` : undefined}
                className={input}
              />
              {shown && reasonError && (
                <p id={`${ids.reason}-err`} className="text-danger text-sm">
                  {reasonError}
                </p>
              )}
              <p className="bg-surface-2 text-text-2 rounded-md p-3 text-sm">
                {t.invoiceWrong}{" "}
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={onUploadInstead}
                >
                  <Upload aria-hidden />
                  {t.uploadInstead}
                </Button>
              </p>
            </div>
            <div className="border-border flex flex-wrap justify-end gap-2 border-t px-6 py-4">
              <Dialog.Close asChild>
                <Button type="button" variant="outline" size="lg">
                  {actionLabel.cancel}
                </Button>
              </Dialog.Close>
              <Button type="submit" size="lg" aria-disabled={correct.isPending}>
                {t.save}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
