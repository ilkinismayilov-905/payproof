import { expect, signIn, test, USERS } from "./fixtures";

// I-02: "Demonu sıfırla" brings the demo back to the fixtures in under 3 seconds
test("demo reset: a confirmed link is undone, the overview is back, in under 3 s", async ({
  page,
}) => {
  await signIn(page, USERS.aygun, "/packages/INV-1042");
  const status = page.getByRole("heading", { level: 1 }).locator("..");
  await page.getByRole("button", { name: "Bax və təsdiqlə" }).click();
  await page
    .getByRole("dialog", { name: "INV-1042: sifarişi seçin və təsdiqləyin" })
    .getByRole("button", { name: "Seçilmiş sifarişlə əlaqəni təsdiqlə" })
    .click();
  await expect(status).toContainText("Düzəliş tələb edir");

  await page.getByRole("button", { name: /Aygün Məmmədova/ }).click();
  await page.getByRole("menuitem", { name: "Demo məlumatlarını sıfırla" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Demonu sıfırlamaq?" });
  const started = Date.now();
  await confirm.getByRole("button", { name: "Bəli, sıfırla" }).click();
  await expect(page.getByText("Demo məlumatları ilkin vəziyyətə qaytarıldı.")).toBeVisible({
    timeout: 3_000,
  });
  expect(Date.now() - started).toBeLessThan(3_000);
  await expect(page).toHaveURL(/\/overview$/);

  // client-side navigation: the mock keeps its (reset) data, the real API serves the fixtures
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /Faktura paketləri/ })
    .click();
  await page
    .getByRole("table", { name: "Faktura paketləri" })
    .getByRole("link", { name: "INV-1042" })
    .click();
  await expect(status).toContainText("Yoxlama tələb edir");
});
