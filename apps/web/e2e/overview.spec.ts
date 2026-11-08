import { expect, test } from "@playwright/test";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";

test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.evaluate((token) => sessionStorage.setItem("payproof.token", token), AYGUN);
  await page.goto("/overview");
});

test("acceptance values from the mock API", async ({ page }) => {
  const amounts = page.getByRole("region", { name: "Açıq problemli faktura məbləği" });
  await expect(amounts).toContainText("29.706,00 AZN");
  await expect(amounts).toContainText("1.800,00 USD");
  await expect(page.getByRole("region", { name: "Problemdə qalma müddəti" })).toContainText(
    "3,0 gün",
  );
  await expect(page.getByRole("img", { name: /^Status bölgüsü, 14 paket/ })).toBeVisible();
});

test("a KPI card and a donut legend entry open the filtered list", async ({ page }) => {
  await page
    .getByRole("list", { name: "Əsas göstəricilər" })
    .getByRole("link", { name: /Düzəliş tələb edir/ })
    .click();
  await expect(page).toHaveURL(/\/packages\?status=NEEDS_FIX$/);

  await page.goBack();
  await page
    .getByRole("region", { name: "Paketlər statusa görə" })
    .getByRole("link", { name: /Təsdiq gözləyir/ })
    .click();
  await expect(page).toHaveURL(/\/packages\?status=READY_FOR_APPROVAL$/);
});
