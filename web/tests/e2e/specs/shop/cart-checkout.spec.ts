import { expect, test } from "@playwright/test";

test.describe("shop · sepet & checkout", () => {
  test("/shop/cart render eder (boş sepet bile olsa)", async ({ page }) => {
    const resp = await page.goto("/shop/cart");
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await expect(page.locator("body")).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/shop-cart.png`,
      fullPage: false,
    });
  });

  test("/shop/checkout render eder veya login'e yönlendirir", async ({ page }) => {
    const resp = await page.goto("/shop/checkout");
    // Build error 500 olmamalı. Auth gate 307 OK.
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await page.screenshot({
      path: `${test.info().outputDir}/shop-checkout.png`,
      fullPage: false,
    });
  });

  test("/shop/checkout/success render eder", async ({ page }) => {
    const resp = await page.goto("/shop/checkout/success");
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await page.screenshot({
      path: `${test.info().outputDir}/shop-checkout-success.png`,
      fullPage: false,
    });
  });
});
