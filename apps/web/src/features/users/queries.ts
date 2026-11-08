import { unwrap } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const userKeys = {
  all: ["users"] as const,
  assignable: () => [...userKeys.all, "assignable"] as const,
};

/** Members who can own packages or take tasks (excludes read-only). */
export const useAssignableUsers = () =>
  useQuery({
    queryKey: userKeys.assignable(),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/v1/users", { params: { query: { assignable: true } }, signal })),
    select: (data) => data.items,
    staleTime: 5 * 60_000,
  });
