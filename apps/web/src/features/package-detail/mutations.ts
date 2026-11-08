import { unwrap, type ApiError, type Schemas } from "@payproof/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard";
import { packageKeys } from "@/features/packages";
import { taskKeys } from "@/features/tasks";
import { api } from "@/lib/api";

type Pkg = Schemas["PackageDetail"];
const path = (id: string) => ({ params: { path: { package_id: id } } });

/**
 * Shared shape of package mutations: the response is the re-validated package, written straight
 * into the detail cache; lists, dashboard and tasks are refreshed. A 409 (someone changed the
 * package meanwhile) refetches the detail; the global handler shows the message.
 */
export const packageMutationKey = (id: string) => ["package-mutation", id] as const;

function usePackageMutation<V>(id: string, request: (vars: V) => Promise<Pkg>) {
  const client = useQueryClient();
  return useMutation<Pkg, ApiError, V>({
    // one key per package: the page can tell that any change to it is in flight
    mutationKey: packageMutationKey(id),
    mutationFn: request,
    onSuccess: (pkg) => {
      client.setQueryData(packageKeys.detail(id), pkg);
      // lists and audit go stale; the detail was just written from the response, don't refetch it
      void client.invalidateQueries({
        queryKey: packageKeys.all,
        predicate: ({ queryKey }) => queryKey[1] !== "detail" || queryKey[2] !== id,
      });
      void client.invalidateQueries({ queryKey: dashboardKeys.all });
      void client.invalidateQueries({ queryKey: taskKeys.all });
    },
    onError: (error) => {
      if (error.status === 409) void client.invalidateQueries({ queryKey: packageKeys.detail(id) });
    },
  });
}

/** A human confirms the order link (an AI suggestion until then). */
export const useConfirmMatch = (id: string) =>
  usePackageMutation(id, (body: { order_id: string; expected_version: number }) =>
    unwrap(api.POST("/v1/packages/{package_id}/matches", { ...path(id), body })),
  );

/** R-008: a person saw the signature (visual presence only — not legal authentication). */
export const useReviewSignature = (id: string) =>
  usePackageMutation(id, (body: { expected_version: number }) =>
    unwrap(api.POST("/v1/packages/{package_id}/signature-review", { ...path(id), body })),
  );

/** Re-run the deterministic rule engine on the current version. */
export const useValidate = (id: string) =>
  usePackageMutation(id, (body: { expected_version: number }) =>
    unwrap(api.POST("/v1/packages/{package_id}/validate", { ...path(id), body })),
  );
