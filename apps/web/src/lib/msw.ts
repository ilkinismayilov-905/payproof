let started: Promise<void> | undefined;

/** Starts the MSW worker once (StrictMode runs effects twice) when NEXT_PUBLIC_API_MOCK=1. */
export function startMocking(): Promise<void> {
  if (process.env.NEXT_PUBLIC_API_MOCK !== "1") return Promise.resolve();
  started ??= import("@payproof/mocks/browser").then(async ({ createMockWorker }) => {
    await createMockWorker().start();
  });
  return started;
}
