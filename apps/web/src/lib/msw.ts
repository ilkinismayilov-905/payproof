let started: Promise<void> | undefined;

/** Starts the MSW worker once (StrictMode runs effects twice). Browser only — see app/mock-gate. */
export function startMocking(): Promise<void> {
  started ??= import("@payproof/mocks/browser").then(async ({ createMockWorker }) => {
    await createMockWorker().start();
  });
  return started;
}
