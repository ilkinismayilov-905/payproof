"use client";

import { Document, Page, pdfjs } from "react-pdf";
import { useState } from "react";

// pdf.js parses in a worker; the file comes from the exact pdfjs-dist version react-pdf uses
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** One PDF page (no text/annotation layers: the overlay is ours). Loaded client-only. */
export default function PdfPage({
  url,
  page,
  width,
}: {
  url: string;
  page: number;
  width: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <p role="alert" className="text-danger p-4 text-sm">
        Faylı açmaq alınmadı — sitata baxın.
      </p>
    );
  return (
    <Document file={url} onLoadError={() => setFailed(true)} loading={null}>
      <Page
        pageNumber={page}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={null}
      />
    </Document>
  );
}
