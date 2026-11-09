"use client";

import { unwrap } from "@payproof/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

// shortcut: prototype texts live here until the shared i18n package gets demo keys
export const demoText = {
  reset: "Demo məlumatlarını sıfırla",
  confirmTitle: "Demonu sıfırlamaq?",
  confirmBody:
    "Bütün dəyişikliklər (təsdiqlər, yükləmələr, tapşırıqlar) silinəcək və ilkin sintetik məlumatlar bərpa olunacaq. Bu əməliyyat geri qaytarılmır.",
  confirm: "Bəli, sıfırla",
  done: "Demo məlumatları ilkin vəziyyətə qaytarıldı.",
};

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
