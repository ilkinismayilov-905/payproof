import { expect, test, type Page } from "@playwright/test";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";

async function signIn(page: Page, path = "/overview") {
  await page.goto("/login");
  await page.evaluate((token) => sessionStorage.setItem("payproof.token", token), AYGUN);
  await page.goto(path);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

test("keyboard only: skip link, sidebar, search and user menu", async ({ page }) => {
  await signIn(page);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Məzmuna keç" })).toBeFocused();

  // Tab until the sidebar link, then follow it with Enter.
  const packages = page
    .getByRole("navigation", { name: "Əsas naviqasiya" })
    .getByRole("link", { name: "Faktura paketləri" });
  for (let i = 0; i < 15 && !(await packages.evaluate((el) => el === document.activeElement)); i++)
    await page.keyboard.press("Tab");
  await expect(packages).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/packages$/);
  await expect(packages).toHaveAttribute("aria-current", "page");

  await page.getByRole("searchbox", { name: "Paket axtar" }).focus();
  await page.keyboard.type("INV-1042");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/packages\?q=INV-1042$/);

  const account = page.getByRole("button", { name: /Aygün Məmmədova/ });
  await account.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(account).toBeFocused();
});

// /packages: a wide table must scroll inside its own box, never the page
for (const [path, width] of ["/overview", "/packages"].flatMap((p) =>
  [768, 1024, 1440].map((w) => [p, w] as const),
)) {
  test(`no horizontal scroll on ${path} at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await signIn(page, path);
    await page.waitForLoadState("networkidle");
    // the page itself and the scrolling content area (<main> scrolls on its own)
    const overflow = await page.evaluate(() =>
      [document.documentElement, document.getElementById("content")!].map(
        (el) => el.scrollWidth - el.clientWidth,
      ),
    );
    expect(overflow).toEqual([0, 0]);
  });
}

test("below 768px the sidebar is a drawer", async ({ page }) => {
  await page.setViewportSize({ width: 767, height: 800 });
  await signIn(page);
  await expect(page.getByRole("navigation", { name: "Əsas naviqasiya" })).toBeHidden();

  const menuButton = page.getByRole("button", { name: "Menyunu aç" });
  await menuButton.click();
  const drawer = page.getByRole("dialog", { name: "Menyu" });
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(menuButton).toBeFocused();

  await menuButton.click();
  await drawer.getByRole("link", { name: /^Tapşırıqlar/ }).click();
  await expect(page).toHaveURL(/\/tasks$/);
  await expect(drawer).toBeHidden();
});
