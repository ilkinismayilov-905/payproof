import { expect, test } from "./fixtures";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";
const INV_1044 = "0193a000-0000-7000-8002-000000001044";

test("INV-1044: the price cell is highlighted and its evidence opens", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate((t) => sessionStorage.setItem("payproof.token", t), AYGUN);
  await page.goto(`/packages/${INV_1044}`);

  const table = page.getByRole("table", { name: "Müqayisə: faktura · sifariş · təhvil" });
  const price = table.getByRole("cell", { name: /^110,00 AZN.*uyğunsuz/ });
  await expect(price).toBeVisible();
  await expect(price).toHaveCSS("background-color", "rgb(251, 232, 230)"); // --danger-bg

  const open = page.getByRole("button", { name: "Mənbəyə bax: KY-10 Vahid qiymət (Faktura)" });
  await open.click();
  const dialog = page.getByRole("dialog", { name: /^Faktura · .+ · v1$/ });
  await expect(dialog.getByRole("blockquote")).toHaveText(
    "Kərə yağı 82%, 10 kq blok — 50 blok × 110,00",
  );
  await expect(dialog.locator("mark")).toHaveText("Kərə yağı 82%, 10 kq blok — 50 blok × 110,00");
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});
