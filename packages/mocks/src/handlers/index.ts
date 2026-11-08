import type { RequestHandler } from "msw";
import { createDemoDb } from "../domain/seed";
import { EventBus } from "../events";
import type { MockDb, MockDbOptions } from "../store";
import { adminHandlers } from "./admin";
import { approvalHandlers } from "./approval";
import { auditHandlers } from "./audit";
import { authHandlers } from "./auth";
import { documentHandlers } from "./documents";
import { jobHandlers } from "./jobs";
import type { Ctx } from "./http";
import { listHandlers } from "./lists";
import { readHandlers } from "./read";
import { reportHandlers } from "./report";
import { reviewHandlers } from "./review";
import { settingsHandlers } from "./settings";
import { taskHandlers } from "./tasks";

export interface MockApiOptions extends MockDbOptions {
  /** Artificial latency per request (ms). Browser ~400, tests 0. */
  latencyMs?: number;
}

/** One in-memory demo company + the MSW handlers that serve it. */
export function createMockApi(options: MockApiOptions = {}) {
  let db: MockDb = createDemoDb(options);
  const reset = () => {
    db = createDemoDb(options);
  };
  const events = new EventBus();
  const ctx: Ctx = { db: () => db, events, latencyMs: options.latencyMs ?? 0, reset };
  const handlers: RequestHandler[] = [
    ...authHandlers(ctx),
    ...readHandlers(ctx),
    ...listHandlers(ctx),
    ...auditHandlers(ctx),
    ...reviewHandlers(ctx),
    ...documentHandlers(ctx),
    ...jobHandlers(ctx),
    ...taskHandlers(ctx),
    ...approvalHandlers(ctx),
    ...reportHandlers(ctx),
    ...adminHandlers(ctx),
    ...settingsHandlers(ctx),
  ];
  return {
    handlers,
    get db() {
      return db;
    },
    /** Live events of successful writes (ADR-0010). */
    events,
    /** Back to the fixtures dataset (demo reset, test isolation). */
    reset,
  };
}
