import { unwrap } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const taskKeys = {
  all: ["tasks"] as const,
  // own key: a limit=1 response must never be mistaken for the task list (W-12)
  openCount: () => [...taskKeys.all, "open-count"] as const,
};

/** Sidebar badge: tasks not yet RESOLVED, from the list's `status_counts` (one item is enough). */
export const useOpenTaskCount = () =>
  useQuery({
    queryKey: taskKeys.openCount(),
    queryFn: ({ signal }) =>
      unwrap(api.GET("/v1/tasks", { params: { query: { status: "active", limit: 1 } }, signal })),
    select: ({ status_counts: c }) => c.OPEN + c.IN_PROGRESS + c.SUBMITTED_FOR_RECHECK,
  });
