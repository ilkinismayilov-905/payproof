import { formatMoney } from "@payproof/api-client/format";
import { mockIds } from "@payproof/mocks";
import { waitFor } from "@testing-library/react";
import { beforeEach, expect, test } from "vitest";
import { useAttentionPackages } from "@/features/packages";
import { setToken } from "@/lib/auth";
import { renderHookWithQuery } from "@/test/render";
import { daysBetween, useDashboard } from "./queries";

beforeEach(() => setToken(`mock.${mockIds.user("u1")}`));

test("dashboard figures from the mock API (acceptance values)", async () => {
  const { result } = renderHookWithQuery(() => useDashboard());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const d = result.current.data!;
  expect(d.open_problem_amounts.map((a) => formatMoney(a.total))).toEqual([
    "29.706,00 AZN",
    "1.800,00 USD",
  ]);
  expect(d.problem_age.average_days).toBe("3.0");
});

test("attention list: open problems only, longest first, at most 5", async () => {
  const { result } = renderHookWithQuery(() => useAttentionPackages());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  const items = result.current.data!;
  expect(items.length).toBeLessThanOrEqual(5);
  expect(items.every((p) => p.status === "NEEDS_FIX" || p.status === "NEEDS_REVIEW")).toBe(true);
  expect(items[0]!.invoice_number).toBe("INV-1042"); // the dashboard's "longest"
});

test("daysBetween counts calendar days like the prototype", () => {
  expect(daysBetween("2026-11-03T09:00:00Z", "2026-11-08T06:30:00Z")).toBe(5);
  expect(daysBetween("2026-11-08T01:00:00Z", "2026-11-08T23:00:00Z")).toBe(0);
});
