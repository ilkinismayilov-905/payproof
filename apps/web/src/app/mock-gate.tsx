"use client";

import { useEffect, useState, type ReactNode } from "react";
import { startMocking } from "@/lib/msw";

/** Mock mode: no request may leave before the MSW worker is up. Loaded client-only. */
export default function MockGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    void startMocking().then(() => setReady(true));
  }, []);
  return ready ? children : null;
}
