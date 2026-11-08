import { unwrap } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => unwrap(api.GET("/v1/dashboard", { signal })),
  });

// Calendar day on the Baku clock (UTC+4, no DST) — the same rule the server uses for problem age.
const bakuDay = (iso: string) => Math.floor((Date.parse(iso) + 4 * 3_600_000) / 86_400_000);

/** Whole Baku calendar days from `from` to `to`, never negative (the "Gün" column). */
export const daysBetween = (from: string, to: string) => Math.max(0, bakuDay(to) - bakuDay(from));
