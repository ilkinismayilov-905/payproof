import { unwrap } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const customerKeys = {
  all: ["customers"] as const,
};

export const useCustomers = () =>
  useQuery({
    queryKey: customerKeys.all,
    queryFn: ({ signal }) => unwrap(api.GET("/v1/customers", { signal })),
    select: (data) => data.items,
    staleTime: 5 * 60_000, // changes rarely (rule sets, W-15)
  });
