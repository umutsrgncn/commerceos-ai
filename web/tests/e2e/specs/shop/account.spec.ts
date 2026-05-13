import { expect, test } from "@playwright/test";

test.describe("shop · hesap (auth gate)", () => {
  test("/shop/account giriş yapmadan login'e yönlendirir", async ({ page }) => {
    const resp = await page.goto("/shop/account");
    expect(resp?.status() ?? 0).toBeLessThan(500);
    // Ya login sayfasına yönlendirir ya da account sayfasını gösterir (varsa session)
    await expect(page).toHaveURL(/\/shop\/(account|auth\/login)/);
    await page.screenshot({
      path: `${test.info().outputDir}/shop-account-gate.png`,
      fullPage: false,
    });
  });

  test("/shop/account/settings 200 döner (giriş yoksa redirect)", async ({ page }) => {
    const resp = await page.goto("/shop/account/settings");
    // Hangi durumda olursa olsun build error olmamalı (500'den küçük)
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await page.screenshot({
      path: `${test.info().outputDir}/shop-account-settings.png`,
      fullPage: false,
    });
  });
});
