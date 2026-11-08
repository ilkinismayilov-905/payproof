import { ApiError } from "@payproof/api-client";
import { mockIds } from "@payproof/mocks";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, test, vi } from "vitest";
import { setToken } from "@/lib/auth";
import { renderHookWithQuery, renderWithQuery, testQueryClient } from "@/test/render";
import { UploadDialog } from "./components/upload-dialog";
import { usePackage } from "./queries";

// multipart cannot run in jsdom (see upload-request.test.ts): the request is stubbed here
const mutate = vi.fn();
vi.mock("./mutations", async (orig) => ({
  ...(await orig<typeof import("./mutations")>()),
  useUploadDocument: () => ({ mutate, isPending: false }),
  useJob: () => ({ data: undefined }),
}));

beforeEach(() => {
  setToken(`mock.${mockIds.user("u1")}`);
  vi.stubEnv("NEXT_PUBLIC_API_MOCK", "1");
  mutate.mockReset();
});

async function open() {
  const client = testQueryClient();
  const q = renderHookWithQuery(() => usePackage(mockIds.pkg("pkg_1042")), client);
  await waitFor(() => expect(q.result.current.data).toBeDefined());
  const pkg = q.result.current.data!;
  renderWithQuery(
    <UploadDialog pkg={pkg} open onOpenChange={() => {}} initialType="invoice" />,
    client,
  );
  return pkg;
}

test("a file is required", async () => {
  await open();
  await userEvent.click(screen.getByRole("button", { name: /Yüklə və emal et/ }));
  expect(screen.getByRole("alert")).toHaveTextContent("Fayl seçin.");
  expect(mutate).not.toHaveBeenCalled();
});

test("a new invoice version goes to the existing document with one key per intent", async () => {
  const pkg = await open();
  await userEvent.click(screen.getByRole("radio", { name: /INV-1042_v2_PO-381\.pdf/ }));
  const submit = screen.getByRole("button", { name: /Yüklə və emal et/ });
  await userEvent.click(submit);
  const [input] = mutate.mock.calls[0]!;
  expect(input).toMatchObject({
    type: "invoice",
    expectedVersion: pkg.version,
    documentId: pkg.documents.find((d) => d.type === "invoice")!.id,
  });
  expect(input.file.name).toBe("INV-1042_v2_PO-381.pdf");
  await userEvent.click(submit); // a retry of the same intent reuses the key
  expect(mutate.mock.calls[1]![0].idempotencyKey).toBe(input.idempotencyKey);
});

test("a duplicate is flagged and the refusal says no version was created", async () => {
  await open();
  const dup = screen.getByRole("radio", { name: /^INV-1042\.pdf/ });
  expect(dup.closest("label")).toHaveTextContent("Təkrar fayl");
  mutate.mockImplementation((_input, { onError }) =>
    onError(new ApiError("DUPLICATE_FILE", "dup", 409)),
  );
  await userEvent.click(dup);
  await userEvent.click(screen.getByRole("button", { name: /Yüklə və emal et/ }));
  expect(await screen.findByText(/yeni versiya yaradılmadı/)).toBeInTheDocument();
});

test("a version conflict offers to reload", async () => {
  await open();
  mutate.mockImplementation((_input, { onError }) =>
    onError(new ApiError("VERSION_CONFLICT", "stale", 409)),
  );
  await userEvent.click(screen.getByRole("radio", { name: /INV-1042_v2_PO-381\.pdf/ }));
  await userEvent.click(screen.getByRole("button", { name: /Yüklə və emal et/ }));
  expect(await screen.findByText(/Paket yenilənib/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Yenilə" })).toBeInTheDocument();
});
