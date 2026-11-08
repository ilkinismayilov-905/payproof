import type { Schemas } from "@payproof/api-client";
import type { QueryKey } from "@tanstack/react-query";
import { customerKeys } from "@/features/customers";
import { dashboardKeys } from "@/features/dashboard";
import { notificationKeys } from "@/features/notifications";
import { packageKeys } from "@/features/packages";
import { taskKeys } from "@/features/tasks";

type LiveEvent = Schemas["LiveEvent"];

/**
 * What a live event makes stale (ADR-0010). Events carry IDs only, so the data itself is refetched
 * over REST with the viewer's own permissions. `"all"` for types this client doesn't know yet.
 */
export function liveInvalidation(event: LiveEvent): QueryKey[] | "all" {
  switch (event.type) {
    case "package.created":
    case "package.updated":
    case "package.approved":
    case "package.exported":
    case "package.deleted":
      // packageKeys.all covers every list and detail; status counts feed the dashboard and task badge
      return [packageKeys.all, dashboardKeys.all, taskKeys.all];
    case "task.changed":
      return [
        taskKeys.all,
        ...(event.package_id ? [packageKeys.detail(event.package_id)] : []),
        dashboardKeys.all,
      ];
    case "notification.created":
      return [notificationKeys.all];
    case "requirements.changed":
      return [customerKeys.all, packageKeys.all, dashboardKeys.all];
    default:
      return "all";
  }
}
