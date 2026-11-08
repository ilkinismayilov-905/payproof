import "@testing-library/jest-dom/vitest";
import { resetMockDb, server } from "@payproof/mocks/node";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setToken } from "@/lib/auth";

// jsdom has no matchMedia: every query reports "no match" (a narrow, mouse-less screen).
// (guarded: a few request-level tests run in the node environment)
if (typeof window !== "undefined")
  window.matchMedia ??= (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  resetMockDb();
  setToken(null);
});
afterAll(() => server.close());
