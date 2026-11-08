import { expect, test as base, type Page } from "@playwright/test";

// Expected API refusals (409 duplicate, 403 role, …) are part of the flows under test; Chrome logs
// each such response. Anything else in the console — or an uncaught error — fails the test.
const EXPECTED = /Failed to load resource: the server responded with a status of 4\d\d/;

export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error" && !EXPECTED.test(m.text())) errors.push(m.text());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      await use();
      expect(errors, "no console errors").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect, type Page };

export const USERS = {
  aygun: "mock.0193a000-0000-7000-8000-000000000001", // operator
  resad: "mock.0193a000-0000-7000-8000-000000000002", // approver
  kamran: "mock.0193a000-0000-7000-8000-000000000005", // read-only auditor
} as const;

/** Signs in through the demo token, then opens `path` (a full load: the mock data starts fresh). */
export async function signIn(page: Page, token: string, path: string) {
  await page.goto("/login");
  await page.evaluate((t) => sessionStorage.setItem("payproof.token", t), token);
  await page.goto(path);
}
