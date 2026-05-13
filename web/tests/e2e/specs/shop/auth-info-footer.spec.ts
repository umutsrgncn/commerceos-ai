import { expect, test } from "@playwright/test";

test.describe("shop · auth / info / footer route'ları", () => {
  const routes = [
    "/shop/auth/login",
    "/shop/auth/register",
    "/shop/yardim",
    "/shop/iade",
    "/shop/kargo",
    "/shop/kvkk",
    "/shop/iletisim",
  ];

  for (const url of routes) {
    test(`${url} build hatasız render eder`, async ({ page }) => {
      const resp = await page.goto(url);
      // 500 = build/runtime error. 200/3xx/404 OK.
      expect(resp?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      const safeName = url.replace(/[\/\\]/g, "_");
      await page.screenshot({
        path: `${test.info().outputDir}/shop${safeName}.png`,
        fullPage: false,
      });
    });
  }
});

test.describe("shop · genel header/footer", () => {
  test("ana sayfada header + footer var", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("link", { name: /yardım|kargo|iletişim/i }).first()).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/shop-header-footer.png`,
      fullPage: false,
    });
  });
});
