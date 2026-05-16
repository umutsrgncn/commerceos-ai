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
    // Logo: SVG + span "CommerceOS" aynı link içinde — direkt link role'ünü hedefle.
    // (.or() strict mode'da 2 element döndürünce fail eder; tek deterministik locator.)
    await expect(
      page.getByRole("link", { name: /CommerceOS/i }).first(),
    ).toBeVisible();
    await page.screenshot({
      path: `${test.info().outputDir}/brand-logo.png`,
      fullPage: false,
    });
  });

  test("/watch landing showcase build hatasız", async ({ page }) => {
    const resp = await page.goto("/watch");
    expect(resp?.status() ?? 0).toBeLessThan(500);
    await page.screenshot({
      path: `${test.info().outputDir}/watch.png`,
      fullPage: false,
    });
  });
});

test.describe("shared · public auth (login/signup)", () => {
  for (const url of ["/login", "/signup"]) {
    test(`${url} render eder`, async ({ page }) => {
      const resp = await page.goto(url);
      expect(resp?.status() ?? 0).toBeLessThan(500);
      await expect(page.locator("body")).toBeVisible();
      const safe = url.replace(/[\/]/g, "_");
      await page.screenshot({
        path: `${test.info().outputDir}/public${safe}.png`,
        fullPage: false,
      });
    });
  }
});
