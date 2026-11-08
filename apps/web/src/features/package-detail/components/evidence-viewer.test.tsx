import type { Schemas } from "@payproof/api-client";
import { mockIds } from "@payproof/mocks";
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";
import { setToken } from "@/lib/auth";
import { EvidenceViewer } from "./evidence-viewer";

beforeEach(() => {
  setToken(`mock.${mockIds.user("u1")}`);
  vi.stubEnv("NEXT_PUBLIC_API_MOCK", "1");
});

const version = (id: string, n: number, source_kind: "pdf" | "scan" = "pdf") =>
  ({
    id,
    version_no: n,
    file_name: `INV-1047_v${n}.pdf`,
    source_kind,
  }) as Schemas["DocumentVersion"];
const pkg = (current: Schemas["DocumentVersion"], history: Schemas["DocumentVersion"][] = []) =>
  ({
    customer: { name: "C Restoran Qrupu" },
    documents: [{ id: "d1", type: "invoice", current, history }],
    fields: [],
  }) as unknown as Schemas["PackageDetail"];
const evidence = (document_version_id: string) => ({
  document_version_id,
  page: 2,
  quote: "Sifariş №: PO-3?7",
  bbox: null,
});

test("evidence from an older version and from a scan is flagged", () => {
  render(
    <EvidenceViewer
      pkg={pkg(version("v2", 2, "scan"), [version("v1", 1, "scan")])}
      evidence={evidence("v1")}
      label="PO"
      onClose={vi.fn()}
    />,
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveTextContent("Köhnə versiya: bu sübut v1-dəndir, cari versiya v2-dir.");
  expect(dialog).toHaveTextContent(
    "Skan sənəd: mətn OCR ilə oxunub — dəyəri mənbə ilə müqayisə edin.",
  );
  expect(dialog).toHaveAccessibleDescription("Səhifə 2 · PO");
});
