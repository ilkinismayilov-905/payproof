"use client";

import type { Schemas } from "@payproof/api-client";
import { actionLabel, documentTypeLabel } from "@payproof/api-client/i18n";
import { X } from "lucide-react";
import { Dialog } from "radix-ui";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/layout";
import { PaperPage } from "./paper-page";
import { SourceFile } from "./source-file";

type Pkg = Schemas["PackageDetail"];

/** The document version an evidence points at, and whether it is the current one. */
function sourceOf(pkg: Pkg, versionId: string) {
  for (const doc of pkg.documents) {
    if (doc.current.id === versionId) return { doc, version: doc.current, current: true };
    const old = doc.history.find((v) => v.id === versionId);
    if (old) return { doc, version: old, current: false };
  }
}

interface Props {
  pkg: Pkg;
  evidence: Schemas["Evidence"] | null;
  label: string;
  onClose: () => void;
}

/** Shows where a value comes from: page, quote and — when known — the highlighted area. */
export function EvidenceViewer({ pkg, evidence, label, onClose }: Props) {
  const opener = useRef<HTMLElement | null>(null);
  const source = evidence && sourceOf(pkg, evidence.document_version_id);
  return (
    <Dialog.Root open={Boolean(evidence)} onOpenChange={(open) => open || onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-overlay fixed inset-0 z-50" />
        <Dialog.Content
          onOpenAutoFocus={() => (opener.current = document.activeElement as HTMLElement | null)}
          onCloseAutoFocus={(e) => {
            e.preventDefault(); // opened from state, not a Dialog.Trigger
            opener.current?.focus();
          }}
          className="bg-surface border-border shadow-3 fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-32px)] w-[min(760px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border"
        >
          {evidence && source && (
            <>
              <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
                <div>
                  <Dialog.Title className="text-xl font-semibold">
                    {`${documentTypeLabel[source.doc.type]} · ${source.version.file_name} · v${source.version.version_no}`}
                  </Dialog.Title>
                  <Dialog.Description className="text-text-2 text-sm">{`Səhifə ${evidence.page} · ${label}`}</Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label={actionLabel.close}
                  className="text-text-2 hover:bg-surface-2 focus-visible:ring-ring grid size-10 place-items-center rounded-md outline-none focus-visible:ring-2"
                >
                  <X aria-hidden className="size-5" />
                </Dialog.Close>
              </div>
              <div className="flex flex-col gap-3 overflow-auto px-6 pb-6">
                {!source.current && (
                  <Banner
                    tone="warning"
                    title={`Köhnə versiya: bu sübut v${source.version.version_no}-dəndir, cari versiya v${source.doc.current.version_no}-dir.`}
                  />
                )}
                {source.version.source_kind === "scan" && (
                  <Banner
                    tone="warning"
                    title="Skan sənəd: mətn OCR ilə oxunub — dəyəri mənbə ilə müqayisə edin."
                  />
                )}
                {!evidence.bbox && (
                  <Banner
                    tone="neutral"
                    title="Vurğulama koordinatı yoxdur — səhifə və sitat göstərilir."
                  />
                )}
                <figure>
                  <figcaption className="text-text-3 text-xs font-bold uppercase">Sitat</figcaption>
                  <blockquote className="border-brand mt-1 border-l-4 pl-3">
                    {evidence.quote}
                  </blockquote>
                </figure>
                {process.env.NEXT_PUBLIC_API_MOCK === "1" ? (
                  <PaperPage
                    pkg={pkg}
                    version={source.version}
                    docType={source.doc.type}
                    evidence={evidence}
                  />
                ) : (
                  <SourceFile
                    versionId={source.version.id}
                    fileName={source.version.file_name}
                    page={evidence.page}
                    bbox={evidence.bbox}
                  />
                )}
              </div>
            </>
          )}
          {evidence && !source && (
            // a stale link (e.g. the version list changed meanwhile): still say what is known
            <div className="flex flex-col gap-3 px-6 py-5">
              <Dialog.Title className="text-xl font-semibold">Mənbə sənəd tapılmadı</Dialog.Title>
              <Dialog.Description asChild>
                <blockquote className="border-brand border-l-4 pl-3">{evidence.quote}</blockquote>
              </Dialog.Description>
              <Dialog.Close asChild>
                <Button variant="outline" className="self-end">
                  {actionLabel.close}
                </Button>
              </Dialog.Close>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
