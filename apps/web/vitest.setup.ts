import "@testing-library/jest-dom/vitest";
import { resetMockDb, server } from "@payproof/mocks/node";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { setToken } from "@/lib/auth";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  resetMockDb();
  setToken(null);
});
afterAll(() => server.close());
