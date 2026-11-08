import { expect, test, type Page } from "./fixtures";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";

async function signIn(page: Page, path: string) {
  await page.goto("/login");
  await page.evaluate((t) => sessionStorage.setItem("payproof.token", t), AYGUN);
  await page.goto(path);
}

test("a new package from a demo set opens processing, then shows its result", async ({ page }) => {
  await signIn(page, "/packages");
  await page.getByRole("button", { name: "Yeni paket" }).click();
  const dialog = page.getByRole("dialog", { name: "Yeni faktura paketi" });
  await dialog.getByRole("radio", { name: /INV-1051/ }).check({ force: true });
  await expect(dialog.getByLabel("Müştəri")).toHaveValue(/.+/);
  await dialog.getByRole("button", { name: "Paketi yarat və emal et" }).click();
  await expect(page).toHaveURL(/\/packages\/[0-9a-f-]{36}$/);
  await expect(page.getByText("INV-1051 yaradıldı, sənədlər emal olunur…")).toBeVisible();
  await expect(page.getByText(/^INV-1051 emal olundu: /)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("INV-1051");
});

test("a never-approved package can be deleted after confirming", async ({ page }) => {
  await signIn(page, "/packages/0193a000-0000-7000-8002-000000001048");
  await page.getByRole("button", { name: "Paketi sil" }).click();
  const confirm = page.getByRole("alertdialog", { name: "INV-1048 paketini silmək?" });
  await confirm.getByRole("button", { name: "Bəli, sil" }).click();
  await expect(page).toHaveURL(/\/packages$/);
  await expect(page.getByText("INV-1048 silindi. Audit qeydi saxlanıldı.")).toBeVisible();
  await expect(page.getByRole("table", { name: "Faktura paketləri" })).not.toContainText(
    "INV-1048",
  );
});
