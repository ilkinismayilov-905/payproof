import { ApiError } from "@payproof/api-client";
import { errorFallback } from "@payproof/api-client/i18n";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const messageOf = (error: unknown) =>
  error instanceof ApiError ? error.message : errorFallback.INTERNAL_ERROR;

/** Client errors (4xx) won't change on retry; network and 5xx get two more tries. */
export const shouldRetry = (failureCount: number, error: unknown) =>
  failureCount < 2 && !(error instanceof ApiError && error.status >= 400 && error.status < 500);

/**
 * Global error policy: 401 → onUnauthenticated (sign out + login screen); failed mutations and
 * background refetches → toast with the server's Azerbaijani message. A first-load query error is
 * left to the screen, which renders its own error state.
 */
export function makeQueryClient({ onUnauthenticated }: { onUnauthenticated: () => void }) {
  const handle = (error: unknown, notify: boolean) => {
    if (error instanceof ApiError && error.status === 401) onUnauthenticated();
    else if (notify) toast.error(messageOf(error));
  };
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => handle(error, query.state.data !== undefined),
    }),
    mutationCache: new MutationCache({ onError: (error) => handle(error, true) }),
    defaultOptions: { queries: { staleTime: 30_000, retry: shouldRetry } },
  });
}
