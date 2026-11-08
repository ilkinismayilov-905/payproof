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

const day = (iso: string) => Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);

/** Whole calendar days from `from` to `to` (prototype `days()`), for the "Gün" column. */
export const daysBetween = (from: string, to: string) => Math.round((day(to) - day(from)) / 864e5);
