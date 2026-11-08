import { defineConfig, devices } from "@playwright/test";

// CI: a production build on its own port; locally the dev server (reused when already running)
const ci = !!process.env.CI;
const port = ci ? 3100 : 3000;

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: { baseURL: `http://localhost:${port}`, trace: "on-first-retry" },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    // mock mode is baked in at build time; prebuild generates the MSW worker
    command: ci ? `pnpm build && pnpm exec next start -p ${port}` : "pnpm dev",
    port,
    reuseExistingServer: !ci,
    timeout: 240_000,
    env: { NEXT_PUBLIC_API_MOCK: "1" },
  },
});
