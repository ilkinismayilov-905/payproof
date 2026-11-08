// Browser (web/mobile dev with NEXT_PUBLIC_API_MOCK=1): an MSW service worker over the demo company.
// The app serves public/mockServiceWorker.js (`pnpm exec msw init public`).
import { setupWorker } from "msw/browser";
import { createMockApi, type MockApiOptions } from "./handlers";

/** Realistic pacing for demos: ~400 ms per request, jobs finish after ~800 ms. */
export function createMockWorker(options: MockApiOptions = { latencyMs: 400, jobDelayMs: 800 }) {
  const api = createMockApi(options);
  const worker = setupWorker(...api.handlers);
  return {
    worker,
    api,
    resetMockDb: api.reset,
    /** Unknown requests (assets, HMR) pass through untouched. */
    start: () => worker.start({ onUnhandledFrame: "bypass", quiet: true }),
  };
}
