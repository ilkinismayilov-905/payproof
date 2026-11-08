import { unwrap } from "@payproof/api-client";
import { useQuery } from "@tanstack/react-query";
import { packageKeys } from "@/features/packages";
import { api } from "@/lib/api";

export const usePackage = (id: string) =>
  useQuery({
    queryKey: packageKeys.detail(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/v1/packages/{package_id}", { params: { path: { package_id: id } }, signal }),
      ),
  });

// shortcut: one page of up to 100 events (newest first); a "load more" can follow next_cursor later
export const usePackageAudit = (id: string) =>
  useQuery({
    queryKey: packageKeys.audit(id),
    queryFn: ({ signal }) =>
      unwrap(
        api.GET("/v1/packages/{package_id}/audit", {
          params: { path: { package_id: id }, query: { limit: 100 } },
          signal,
        }),
      ),
    select: (page) => page.items,
  });
