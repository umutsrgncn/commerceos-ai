import { expect, test } from "@playwright/test";

test.describe("admin auth gate", () => {
  test("unauthed visits to /admin redirect to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthed deep-links to /admin/products redirect to /login", async ({ page }) => {
    await page.goto("/admin/products");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthed visits to /admin/ai redirect to /login", async ({ page }) => {
    await page.goto("/admin/ai");
    await expect(page).toHaveURL(/\/login/);
  });
});
