"use client";

import { subscribeEvents, type Schemas } from "@payproof/api-client";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useEffect } from "react";
import { customerKeys } from "@/features/customers";
import { dashboardKeys } from "@/features/dashboard";
import { notificationKeys } from "@/features/notifications";
import { packageKeys } from "@/features/packages";
import { taskKeys } from "@/features/tasks";
import { API_BASE } from "./api";
import { getToken } from "./auth";

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

const POLL_MS = 30_000;

const listeners = new Set<(event: LiveEvent) => void>();

/** Listen to live events (toasts, stale banners). Returns the unsubscribe function. */
export function onLiveEvent(listener: (event: LiveEvent) => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/**
 * One SSE connection for the signed-in app (mounted once in the shell). Events invalidate what
 * they change; a reconnect invalidates everything, since events may have been missed meanwhile.
 * Sign-out or a 401 unmounts the shell, which stops the stream.
 */
export function useLiveUpdates() {
  const queryClient = useQueryClient();
  useEffect(() => {
    let connectedBefore = false;
    // Fallback while the stream is down: active queries every 30 s (ADR-0010).
    let polling: ReturnType<typeof setInterval> | undefined;
    const stopPolling = () => {
      clearInterval(polling);
      polling = undefined;
    };
    const stop = subscribeEvents({
      baseUrl: API_BASE,
      getToken,
      onOpen: () => {
        stopPolling();
        if (connectedBefore) void queryClient.invalidateQueries();
        connectedBefore = true;
      },
      onEvent: (event) => {
        const keys = liveInvalidation(event);
        if (keys === "all") void queryClient.invalidateQueries();
        else for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey });
        listeners.forEach((listener) => listener(event));
      },
      onError: (error) => {
        // 401: the stream has stopped for good and the app is signing out — nothing to poll
        if (error.status === 401 || polling) return;
        polling = setInterval(() => void queryClient.refetchQueries({ type: "active" }), POLL_MS);
      },
    });
    return () => {
      stop();
      stopPolling();
    };
  }, [queryClient]);
}
