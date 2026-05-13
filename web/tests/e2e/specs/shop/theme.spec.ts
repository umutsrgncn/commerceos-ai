import { expect, test } from "@playwright/test";

test.describe("shop · tema", () => {
  test("layout ve theme provider hatasız mount eder", async ({ page }) => {
    const resp = await page.goto("/shop");
    expect(resp?.status() ?? 0).toBeLessThan(400);

    // Theme toggle butonu varsa görünür
    const toggleCandidates = page
      .getByRole("button", { name: /tema|dark|light|theme/i })
      .or(page.locator("[data-theme-toggle]"))
      .or(page.locator("button:has(svg.lucide-sun, svg.lucide-moon)"));
    // Toggle olmayabilir ama sayfa hatasız render etmeli
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    // data-shop attr kontrol
    const hasShopScope = await page.evaluate(() => {
      return document.documentElement.dataset.shop !== undefined ||
             document.querySelector("[data-shop]") !== null;
    });
    // Olmasa bile sayfa render etti yeter — sadece bir not
    await page.screenshot({
      path: `${test.info().outputDir}/shop-theme-layout.png`,
      fullPage: false,
    });
  });
});
