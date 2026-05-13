import { expect, test } from "@playwright/test";

test.describe("shop · kategori", () => {
  test("kategori listesi sayfası 200 döner", async ({ page }) => {
    const resp = await page.goto("/shop/c");
    expect(resp?.status() ?? 0).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/shop-categories.png`,
      fullPage: false,
    });
  });

  test("tişört kategorisi ürünleri listeler", async ({ page }) => {
    const resp = await page.goto("/shop/c/tisort");
    expect(resp?.status() ?? 0).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/shop-category-tisort.png`,
      fullPage: false,
    });
  });
});
