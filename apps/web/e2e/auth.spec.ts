import { expect, test } from "@playwright/test";

test("dev login: pick a demo user, /v1/me drives the app", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: /Rəşad Əliyev/ }).click();
  await page.getByRole("button", { name: "Daxil ol" }).click();

  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Rəşad Əliyev" })).toBeVisible();
  await expect(page.getByText("Rəşad Əliyev kimi daxil oldunuz.")).toBeVisible();
  // Permissions come from /v1/me (approver can approve, operator could not).
  await expect(page.getByRole("list", { name: "Səlahiyyətlər" })).toContainText(
    "Hazır paketi təsdiqləmək",
  );

  // Reload keeps the session (sessionStorage).
  await page.reload();
  await expect(page.getByRole("heading", { name: "Rəşad Əliyev" })).toBeVisible();
});

test("an expired session (401) returns to the login screen", async ({ page }) => {
  await page.goto("/login");
  await page.evaluate(() => sessionStorage.setItem("payproof.token", "mock.expired"));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText("Sessiya bitib. Yenidən daxil olun.")).toBeVisible();
});
