import { setLocale } from "@payproof/api-client/i18n";
import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { PackageActions } from "./components/package-actions";
import { UploadStages } from "./components/upload-stages";

afterEach(() => setLocale("az"));

test("package detail texts follow the English locale", () => {
  setLocale("en");
  render(
    <>
      <PackageActions
        status="EXPORTED"
        recheck={{ onClick: () => {}, pending: false }}
        approval={{ onReExport: vi.fn(), onReport: vi.fn(), pending: false }}
      />
      <UploadStages fileName="a.pdf" stage={1} job={undefined} lost={false} />
    </>,
  );
  expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
    "Re-check",
    "Upload document",
    "Internal report",
    "Download manifest again",
  ]);
  expect(screen.getByRole("status")).toHaveTextContent(
    "Accepted — doneProcessing — doneExtracted — waitingChecked — waiting",
  );
});
