"use client";

import { errorFallback } from "@payproof/api-client/i18n";
import { QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { toast, Toaster } from "sonner";
import { setToken } from "@/lib/auth";
import { startMocking } from "@/lib/msw";
import { makeQueryClient } from "@/lib/query-client";

const MOCK = process.env.NEXT_PUBLIC_API_MOCK === "1";

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
  // In mock mode no request may leave before the worker is up.
  const [ready, setReady] = useState(!MOCK);
  useEffect(() => {
    if (MOCK) void startMocking().then(() => setReady(true));
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {ready ? children : null}
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  );
}
