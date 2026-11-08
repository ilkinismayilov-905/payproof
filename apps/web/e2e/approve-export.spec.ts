import { expect, test, type Page } from "./fixtures";

const AYGUN = "mock.0193a000-0000-7000-8000-000000000001";
const RESAD = "mock.0193a000-0000-7000-8000-000000000002";
const INV_1038 = "/packages/0193a000-0000-7000-8002-000000001038";

async function open(page: Page, token: string, path: string) {
  await page.goto("/login");
  await page.evaluate((t) => sessionStorage.setItem("payproof.token", t), token);
  await page.goto(path);
  await expect(page.getByRole("region", { name: "Yoxlamalar", exact: true })).toBeVisible();
}

test("an operator cannot approve: the button is closed and says who can", async ({ page }) => {
  await open(page, AYGUN, INV_1038);
  const approve = page.getByRole("button", { name: "Təsdiqlə" });
  await expect(approve).toHaveAttribute("aria-disabled", "true");
  await approve.click({ force: true }); // aria-disabled: Playwright would otherwise wait for it
  await expect(page.getByText("Hazır paketi yalnız təsdiqçi təsdiqləyə bilər.")).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("approver: approve → ready to send; export → manifest; re-download creates no new export", async ({
  page,
}) => {
  await open(page, RESAD, INV_1038);
  await page.getByRole("button", { name: "Təsdiqlə" }).click();
  const dialog = page.getByRole("dialog", { name: "INV-1038 paketini təsdiqlə" });
  await dialog.getByRole("button", { name: "Təsdiqlə" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Təsdiqdən əvvəl bu qeydi işarələyin.");
  await dialog.getByRole("checkbox").check();
  await dialog.getByRole("button", { name: "Təsdiqlə" }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("region", { name: /-lik faktura paketi göndərilməyə hazırdır$/ }),
  ).toBeVisible();

  await page.getByRole("button", { name: "İxrac et" }).click();
  const exp = page.getByRole("dialog", { name: "INV-1038: ixrac paketi" });
  const zip = page.waitForEvent("download");
  await exp.getByRole("button", { name: "İxrac et və manifesti yüklə" }).click();
  expect((await zip).suggestedFilename()).toMatch(/^PayProof_INV-1038_v\d+\.zip$/);
  await expect(page.getByText(/INV-1038 v\d+ ixrac edildi\. Manifest yükləndi\./)).toBeVisible();

  const again = page.waitForEvent("download");
  await page.getByRole("button", { name: "Manifesti yenidən yüklə" }).click();
  await again;
  await expect(page.getByText(/yeni audit hadisəsi yaradılmadı/)).toBeVisible();
});
