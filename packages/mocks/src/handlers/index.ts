import type { RequestHandler } from "msw";
import { createDemoDb } from "../domain/seed";
import type { MockDb, MockDbOptions } from "../store";
import { authHandlers } from "./auth";
import type { Ctx } from "./http";
import { listHandlers } from "./lists";
import { readHandlers } from "./read";

export interface MockApiOptions extends MockDbOptions {
  /** Artificial latency per request (ms). Browser ~400, tests 0. */
  latencyMs?: number;
}

/** One in-memory demo company + the MSW handlers that serve it. */
export function createMockApi(options: MockApiOptions = {}) {
  let db: MockDb = createDemoDb(options);
  const ctx: Ctx = { db: () => db, latencyMs: options.latencyMs ?? 0 };
  const handlers: RequestHandler[] = [
    ...authHandlers(ctx),
    ...readHandlers(ctx),
    ...listHandlers(ctx),
  ];
  return {
    handlers,
    get db() {
      return db;
    },
    /** Back to the fixtures dataset (demo reset, test isolation). */
    reset() {
      db = createDemoDb(options);
    },
  };
}
