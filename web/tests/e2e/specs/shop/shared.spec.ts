import { expect, test } from "@playwright/test";

test.describe("shared · landing + brand", () => {
  test("/ landing render eder", async ({ page }) => {
    const resp = await page.goto("/");
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("h1").first()).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/landing.png`,
      fullPage: false,
    });
  });

  test("CommerceOS logo herhangi bir sayfada görünür", async ({ page }) => {
    await page.goto("/");
    // Logo bir SVG veya bir text. En azından bir <svg> veya 'CommerceOS' metni olsun
    const logoSvg = page.locator("svg").first();
    const logoText = page.getByText(/CommerceOS|commerceos/i).first();
    await expect(logoSvg.or(logoText)).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/brand-logo.png`,
      fullPage: false,
    });
  });
});
