import { expect, test, type Page } from "@playwright/test";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";
const pkgUrl = (n: number) => `/packages/0193a000-0000-7000-8002-00000000${n}`;

async function open(page: Page, n: number) {
  await page.goto("/login");
  await page.evaluate((t) => sessionStorage.setItem("payproof.token", t), AYGUN);
  await page.goto(pkgUrl(n));
  await expect(page.getByRole("region", { name: "Yoxlamalar" })).toBeVisible();
}
const status = (page: Page) => page.getByRole("heading", { level: 1 }).locator("..");

test("INV-1047: correcting the unreadable PO from the source makes the package ready", async ({
  page,
}) => {
  await open(page, 1047);
  await page.getByRole("button", { name: "Mənbəyə bax, sahəni düzəlt" }).click();
  const dialog = page.getByRole("dialog", { name: /^Çıxarışı düzəlt:/ });
  await dialog.getByLabel("Yeni dəyər").fill("PO-397");
  await dialog.getByLabel("Səbəb").fill("Skanda 7 aydın görünür");
  await dialog.getByRole("button", { name: "Düzəlişi yadda saxla" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(/düzəldildi\. Paket v\d+ yenidən yoxlandı: Təsdiq gözləyir\./),
  ).toBeVisible();
  await expect(status(page)).toContainText("Təsdiq gözləyir");
});

test("INV-1042: a new invoice version goes through the stages; the same file again creates none", async ({
  page,
}) => {
  await open(page, 1042);
  await page.getByRole("button", { name: "Sənəd yüklə" }).click();
  let dialog = page.getByRole("dialog", { name: "INV-1042: sənəd yüklə" });
  await dialog.getByLabel("Sənəd növü").selectOption("invoice");
  // the file already in the package: refused, nothing changes
  await dialog.getByRole("radio", { name: /^INV-1042\.pdf/ }).check({ force: true });
  await dialog.getByRole("button", { name: "Yüklə və emal et" }).click();
  await expect(
    dialog.getByText("Bu fayl paketdə artıq var — yeni versiya yaradılmadı."),
  ).toBeVisible();
  await expect(page.getByText("Paket v1", { exact: true })).toBeVisible();

  await dialog.getByRole("radio", { name: /INV-1042_v2_PO-381\.pdf/ }).check({ force: true });
  await dialog.getByRole("button", { name: "Yüklə və emal et" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(/INV-1042_v2_PO-381\.pdf yükləndi\. Paket v2 yenidən yoxlandı/),
  ).toBeVisible();
  await expect(page.getByText("Paket v2", { exact: true })).toBeVisible();
  const invoice = page.getByRole("article", { name: "Faktura" });
  await expect(invoice).toContainText("INV-1042_v2_PO-381.pdf");
  await expect(invoice).toContainText("Əvvəlki versiyalar (1)");

  // the replaced version is history now: uploading it again still creates nothing
  await page.getByRole("button", { name: "Sənəd yüklə" }).click();
  dialog = page.getByRole("dialog", { name: "INV-1042: sənəd yüklə" });
  await dialog.getByLabel("Sənəd növü").selectOption("invoice");
  await dialog.getByRole("radio", { name: /^INV-1042\.pdf/ }).check({ force: true });
  await dialog.getByRole("button", { name: "Yüklə və emal et" }).click();
  await expect(dialog.getByText(/yeni versiya yaradılmadı/)).toBeVisible();
  await expect(page.getByText("Paket v2", { exact: true })).toBeVisible();
});
