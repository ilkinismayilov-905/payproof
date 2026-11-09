"use client";

import { unwrap } from "@payproof/api-client";
import { demoText } from "@payproof/api-client/i18n";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

export { demoText };

/**
 * `POST /v1/demo/reset` (ENV=dev only — the API has no such route elsewhere). The demo ids are
 * derived from fixture slugs, so the session stays valid; every cached query is refetched.
 */
export function useResetDemo() {
  const client = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => unwrap(api.POST("/v1/demo/reset")),
    onSuccess: async () => {
      router.replace("/overview");
      await client.invalidateQueries();
      toast.info(demoText.done);
    },
  });
}
