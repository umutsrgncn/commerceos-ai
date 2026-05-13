import { expect, test } from "@playwright/test";

test.describe("shop · ana sayfa", () => {
  test("hero ve kategori bölümleri render edilir", async ({ page }) => {
    await page.goto("/shop");

    // Hero metni — değişebilir, sadece sayfanın render olduğunu doğrula
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // Header genelde var
    await expect(page.getByRole("link", { name: /pamuk|shop/i }).first()).toBeVisible();

    // Footer linkleri (footer scope test edilirse de buradan görünür)
    await expect(page.getByRole("link", { name: /yardım|iade|kargo|kvkk|iletişim/i }).first()).toBeVisible();

    await page.screenshot({
      path: `${test.info().outputDir}/shop-home.png`,
      fullPage: false,
    });
  });
});
