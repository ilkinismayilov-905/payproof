import { unwrap, type ApiError } from "@payproof/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/features/dashboard";
import { packageKeys } from "@/features/packages";
import { api } from "@/lib/api";
import { packageMutationKey } from "./mutations";

/** Bound to what the user saw: the version and the rule set. One key per intent (dialog). */
interface Intent {
  expected_version: number;
  expected_requirement_set_version: number;
  idempotencyKey: string;
}

/**
 * Approve/export answer with a record, not the package: refetch it and everything listing it.
 * A 409 VERSION_CONFLICT is explained by the "Paket yenilənib" dialog, not a toast.
 */
function useApprovalMutation<T, V extends Intent>(id: string, request: (vars: V) => Promise<T>) {
  const client = useQueryClient();
  return useMutation<T, ApiError, V>({
    mutationKey: packageMutationKey(id),
    mutationFn: request,
    meta: { inlineErrors: ["VERSION_CONFLICT"] },
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: packageKeys.all }),
        client.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]),
  });
}

/** "Ready to send" — not a payment approval. Approver only; the server checks the role. */
export const useApprove = (id: string) =>
  useApprovalMutation(id, ({ idempotencyKey, ...body }: Intent) =>
    unwrap(
      api.POST("/v1/packages/{package_id}/approve", {
        params: { path: { package_id: id }, header: { "Idempotency-Key": idempotencyKey } },
        body: { ...body, documents_reviewed: true },
      }),
    ),
  );

/** Exports the approved current version with the chosen documents (the invoice is mandatory). */
export const useExport = (id: string) =>
  useApprovalMutation(
    id,
    ({ idempotencyKey, ...body }: Intent & { document_version_ids: string[] }) =>
      unwrap(
        api.POST("/v1/packages/{package_id}/export", {
          params: { path: { package_id: id }, header: { "Idempotency-Key": idempotencyKey } },
          body,
        }),
      ),
  );

/** A fresh short-lived link to an existing export — no new export event. */
export const exportDownload = (exportId: string) =>
  unwrap(
    api.GET("/v1/exports/{export_id}/download", { params: { path: { export_id: exportId } } }),
  );

/** Internal validation report of the current version (never part of the customer package). */
export const internalReport = (id: string) =>
  unwrap(
    api.GET("/v1/packages/{package_id}/internal-report", { params: { path: { package_id: id } } }),
  );

/** Hands a URL or JSON to the browser as a download. */
export function saveFile(name: string, source: string | object) {
  const href =
    typeof source === "string"
      ? source
      : URL.createObjectURL(
          new Blob([JSON.stringify(source, null, 2)], { type: "application/json" }),
        );
  const a = Object.assign(document.createElement("a"), { href, download: name });
  a.click();
  if (typeof source !== "string") setTimeout(() => URL.revokeObjectURL(href), 0);
}
