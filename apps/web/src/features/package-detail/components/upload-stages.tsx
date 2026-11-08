import type { Schemas } from "@payproof/api-client";
import { Check, Clock } from "lucide-react";
import { Banner } from "@/components/ui/layout";
import { UPLOAD_STAGES } from "../upload-helpers";

/** Where the upload is: accepted → processing → extracted → checked, or why it failed. */
export function UploadStages({
  fileName,
  stage,
  job,
}: {
  fileName: string;
  stage: number;
  job: Schemas["Job"] | undefined;
}) {
  return (
    <div role="status" className="flex flex-col gap-2">
      <p className="text-sm font-bold break-all">{fileName}</p>
      <ol className="flex flex-col gap-1.5">
        {UPLOAD_STAGES.map((label, k) => (
          <li
            key={label}
            className={`flex items-center gap-2 text-sm ${k <= stage ? "" : "text-text-3"}`}
          >
            {k <= stage ? (
              <Check aria-hidden className="text-success size-4" />
            ) : (
              <Clock aria-hidden className="size-4" />
            )}
            {label}
            <span className="sr-only">{k <= stage ? " — tamamlandı" : " — gözləyir"}</span>
          </li>
        ))}
      </ol>
      {job?.status === "FAILED" && (
        <Banner tone="danger" role="alert" title="Emal alınmadı — yeni versiya yaradılmadı.">
          {job.error?.message}
        </Banner>
      )}
    </div>
  );
}
