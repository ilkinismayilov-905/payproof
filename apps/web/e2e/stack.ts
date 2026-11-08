// E2E_API=real: the suite runs against apps/api (worker, mock AI adapter) instead of MSW.
// The stack gets its own database and ports: every test reseeds it (fixtures.ts), so it must
// never be the database you work in.
// E2E_API=stack (I-01): the suite runs against the compose stack `make demo` started (web :3000,
// API :8000); Playwright starts nothing and resets the demo through `POST /v1/demo/reset`.
export const STACK = process.env.E2E_API === "stack";
export const REAL = process.env.E2E_API === "real" || STACK;
export const WEB_PORT = STACK
  ? Number(process.env.WEB_PORT ?? 3000)
  : REAL || process.env.CI
    ? 3100
    : 3000;
export const API_URL = STACK
  ? `http://localhost:${process.env.API_PORT ?? 8000}`
  : "http://localhost:8100";

export const API_ENV = {
  ENV: "dev",
  DATABASE_URL:
    process.env.E2E_DATABASE_URL ??
    "postgresql+asyncpg://payproof:payproof@localhost:5432/payproof_e2e",
  S3_ENDPOINT_URL: process.env.S3_ENDPOINT_URL ?? "http://localhost:9000",
  S3_ACCESS_KEY: process.env.S3_ACCESS_KEY ?? "payproof",
  S3_SECRET_KEY: process.env.S3_SECRET_KEY ?? "payproof-secret",
  S3_BUCKET: process.env.S3_BUCKET ?? "payproof-docs",
  JWT_SECRET: "e2e-only",
  AI_PROVIDER: "mock",
  LOG_LEVEL: "WARNING",
  CORS_ORIGINS: `http://localhost:${WEB_PORT}`,
};
