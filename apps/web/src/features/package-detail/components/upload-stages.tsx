import type { Schemas } from "@payproof/api-client";
import { uploadText as t } from "@payproof/api-client/i18n";
import { Check, Clock } from "lucide-react";
import { Banner } from "@/components/ui/layout";
import { UPLOAD_STAGES } from "../upload-helpers";

/** Where the upload is: accepted → processing → extracted → checked, or why it failed. */
export function UploadStages({
  fileName,
  stage,
  job,
  lost,
}: {
  fileName: string;
  stage: number;
  job: Schemas["Job"] | undefined;
  /** The job could not be polled: its result is unknown here, the package page will show it. */
  lost: boolean;
}) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <p className="text-sm font-bold break-all">{fileName}</p>
      <ol className="flex flex-col gap-1.5">
        {UPLOAD_STAGES.map((key, k) => (
          <li
            key={key}
            className={`flex items-center gap-2 text-sm ${k <= stage ? "" : "text-text-3"}`}
          >
            {k <= stage ? (
              <Check aria-hidden className="text-success size-4" />
            ) : (
              <Clock aria-hidden className="size-4" />
            )}
            {t.stages[key]}
            <span className="sr-only">{k <= stage ? t.stageDone : t.stageWaiting}</span>
          </li>
        ))}
      </ol>
      {lost && job?.status !== "FAILED" && (
        <Banner tone="warning" role="alert" title={t.lostTitle}>
          {t.lostBody}
        </Banner>
      )}
      {job?.status === "FAILED" && (
        <Banner tone="danger" role="alert" title={t.failedTitle}>
          {job.error?.message}
        </Banner>
      )}
    </div>
  );
}
