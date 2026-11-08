import { ApiError } from "@payproof/api-client";
import { errorFallback } from "@payproof/api-client/i18n";
import { beforeEach, expect, test, vi } from "vitest";
import { makeQueryClient, shouldRetry } from "./query-client";

const toastError = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const onUnauthenticated = vi.fn();
beforeEach(() => vi.clearAllMocks());

const forbidden = new ApiError("FORBIDDEN", "Səlahiyyət yoxdur.", 403);
const expired = new ApiError("UNAUTHENTICATED", errorFallback.UNAUTHENTICATED, 401);
const failWith = (error: unknown) => () => Promise.reject(error);

test("401 from any query hands over to onUnauthenticated without a toast", async () => {
  const qc = makeQueryClient({ onUnauthenticated });
  await qc.fetchQuery({ queryKey: ["x"], queryFn: failWith(expired) }).catch(() => {});
  expect(onUnauthenticated).toHaveBeenCalledOnce();
  expect(toastError).not.toHaveBeenCalled();
});

test("first-load query errors are left to the screen's error state", async () => {
  const qc = makeQueryClient({ onUnauthenticated });
  await qc.fetchQuery({ queryKey: ["x"], queryFn: failWith(forbidden) }).catch(() => {});
  expect(toastError).not.toHaveBeenCalled();
});

test("a failed background refetch shows the server message as a toast", async () => {
  const qc = makeQueryClient({ onUnauthenticated });
  qc.setQueryData(["x"], { ok: true });
  await qc
    .fetchQuery({ queryKey: ["x"], queryFn: failWith(forbidden), staleTime: 0 })
    .catch(() => {});
  expect(toastError).toHaveBeenCalledWith("Səlahiyyət yoxdur.");
});

test("mutation errors toast; non-API errors get the generic Azerbaijani message", async () => {
  const qc = makeQueryClient({ onUnauthenticated });
  const run = (error: unknown) =>
    qc
      .getMutationCache()
      .build(qc, { mutationFn: failWith(error) })
      .execute(undefined)
      .catch(() => {});
  await run(forbidden);
  await run(new TypeError("boom"));
  expect(toastError.mock.calls).toEqual([["Səlahiyyət yoxdur."], [errorFallback.INTERNAL_ERROR]]);
});

test("retries only network and server errors, at most twice", () => {
  expect(shouldRetry(0, forbidden)).toBe(false);
  expect(shouldRetry(0, new ApiError("NETWORK_ERROR", "x", 0))).toBe(true);
  expect(shouldRetry(1, new ApiError("INTERNAL_ERROR", "x", 503))).toBe(true);
  expect(shouldRetry(2, new ApiError("INTERNAL_ERROR", "x", 503))).toBe(false);
});
