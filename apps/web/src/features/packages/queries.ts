import { unwrap, type paths } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

type ListParams = NonNullable<paths["/v1/packages"]["get"]["parameters"]["query"]>;

export const packageKeys = {
  all: ["packages"] as const,
  list: (params: ListParams) => [...packageKeys.all, "list", params] as const,
};

const ATTENTION: ListParams = {
  status: ["NEEDS_FIX", "NEEDS_REVIEW"],
  sort: "-problem_age",
  limit: 5,
};

/** Overview: open problems that have waited longest. */
export const useAttentionPackages = () =>
  useQuery({
    queryKey: packageKeys.list(ATTENTION),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/v1/packages", { params: { query: ATTENTION }, signal })),
    select: (page) => page.items,
  });
