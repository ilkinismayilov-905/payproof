import { expect, resolvePath, test, tokenFor, USERS } from "./fixtures";

// Smoke in both languages: login → overview → package detail (check messages come from the API/mock).
const LANGS = [
  {
    lang: "az",
    switchTo: "Azərbaycanca",
    signIn: "Daxil ol",
    overview: "İcmal",
    status: "Yoxlama tələb edir",
    rule: "Məcburi sifariş nömrəsi (PO)",
    foreign: /Needs review|Sign in/,
  },
  {
    lang: "en",
    switchTo: "English",
    signIn: "Sign in",
    overview: "Overview",
    status: "Needs review",
    rule: "Mandatory purchase order number (PO)",
    // Azerbaijani UI and server texts must be gone (demo people/company names stay as they are)
    foreign: /Yoxlama tələb edir|Daxil ol|fakturada|sifariş nömrəsi|Tapşırıqlar/,
  },
] as const;

for (const t of LANGS) {
  test(`${t.lang}: login → overview → INV-1042 detail`, async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: t.switchTo }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", t.lang);
    await page.getByRole("radio", { name: new RegExp(USERS.aygun) }).check({ force: true });
    await page.getByRole("button", { name: t.signIn }).click();

    await expect(page.getByRole("link", { name: t.overview }).first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(t.foreign);

    const token = await tokenFor(page.request, USERS.aygun);
    const path = await resolvePath(page.request, token, "/packages/INV-1042");
    // a full load: the session and the remembered language survive it
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 }).locator("..")).toContainText(t.status);
    await expect(page.getByText(t.rule).first()).toBeVisible();
    await expect(page.locator("main")).not.toContainText(t.foreign);
    await expect(page.locator("html")).toHaveAttribute("lang", t.lang);
  });
}
