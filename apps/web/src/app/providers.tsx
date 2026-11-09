"use client";

import { DEFAULT_LOCALE, errorFallback, setLocale } from "@payproof/api-client/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { setToken } from "@/lib/auth";
import { useLocale } from "@/lib/locale";
import { makeQueryClient } from "@/lib/query-client";

// msw/browser has no Node build: keep it out of the server bundle entirely.
const MockGate =
  process.env.NEXT_PUBLIC_API_MOCK === "1"
    ? dynamic(() => import("./mock-gate"), { ssr: false })
    : Fragment;

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [queryClient] = useState(() => {
    const client = makeQueryClient({
      onUnauthenticated: () => {
        setToken(null);
        client.clear();
        // fixed id: parallel 401s show one toast
        toast.error(errorFallback.UNAUTHENTICATED, { id: "unauthenticated" });
        router.replace("/login");
      },
    });
    return client;
  });

  // Texts read the module-level locale, so set it before the children render this pass.
  const locale = useLocale();
  setLocale(locale);
  const fetchedIn = useRef(DEFAULT_LOCALE);
  useEffect(() => {
    document.documentElement.lang = locale;
    if (fetchedIn.current === locale) return;
    fetchedIn.current = locale;
    // server texts (check messages, notifications) were fetched in the other language
    void queryClient.invalidateQueries();
  }, [locale, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <MockGate>
        {/* remount on a language change: every text re-reads the new locale */}
        <Fragment key={locale}>{children}</Fragment>
      </MockGate>
      {/* prototype #toasts: bottom right; follows the OS light/dark like the tokens */}
      <Toaster position="bottom-right" theme="system" richColors closeButton />
    </QueryClientProvider>
  );
}
