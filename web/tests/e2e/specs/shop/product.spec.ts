import { expect, test } from "@playwright/test";

test.describe("shop · ürün detay", () => {
  test("kategori sayfasından ürün linki çalışır", async ({ page }) => {
    await page.goto("/shop/c/tisort");
    const firstProductLink = page.locator("a[href*='/shop/p/']").first();
    if ((await firstProductLink.count()) === 0) {
      test.skip(true, "Kategori boş — ürün detay testi atlandı.");
      return;
    }
    await firstProductLink.click();
    await page.waitForURL(/\/shop\/p\//);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/shop-product-detail.png`,
      fullPage: false,
    });
  });
});
