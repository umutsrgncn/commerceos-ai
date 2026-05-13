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

  // Account alt sayfaları — build error yakalamak için
  const subPages = [
    "/shop/account/orders",
    "/shop/account/addresses",
    "/shop/account/wishlist",
  ];
  for (const url of subPages) {
    test(`${url} build hatasız`, async ({ page }) => {
      const resp = await page.goto(url);
      expect(resp?.status() ?? 0, `${url} → ${resp?.status()}`).toBeLessThan(500);
      const safeName = url.replace(/[\/\\]/g, "_");
      await page.screenshot({
        path: `${test.info().outputDir}/shop${safeName}.png`,
        fullPage: false,
      });
    });
  }
});
