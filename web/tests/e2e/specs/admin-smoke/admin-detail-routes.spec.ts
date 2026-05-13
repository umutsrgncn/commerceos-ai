import { expect, test } from "@playwright/test";

/**
 * Dinamik route smoke testleri — liste sayfasından ilk öğeye click ile detay sayfasına git.
 * Kategori/fatura/sipariş detayları auth-gated; agent ortamında 307 olabilir, 500 olmamalı.
 */

test.describe("admin · dinamik detay route'lar", () => {
  test("/admin/categories liste → ilk kategoriye git", async ({ page }) => {
    const resp = await page.goto("/admin/categories");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("kategoriler listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/categories/']").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|categories)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-category-detail.png`,
      fullPage: false,
    });
  });

  test("/admin/invoices liste → ilk faturaya git", async ({ page }) => {
    const resp = await page.goto("/admin/invoices");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("faturalar listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/invoices/']").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|invoices)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-invoice-detail.png`,
      fullPage: false,
    });
  });

  test("/admin/orders liste → ilk siparişe git", async ({ page }) => {
    const resp = await page.goto("/admin/orders");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("siparişler listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/orders/']").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|orders)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-order-detail.png`,
      fullPage: false,
    });
  });

  test("/admin/products liste → ilk ürüne git", async ({ page }) => {
    const resp = await page.goto("/admin/products");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("ürünler listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/products/']:not([href$='/new'])").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|products)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-product-detail.png`,
      fullPage: false,
    });
  });

  test("/admin/suppliers liste → ilk tedarikçiye git", async ({ page }) => {
    const resp = await page.goto("/admin/suppliers");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("tedarikçiler listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/suppliers/']:not([href$='/new'])").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|suppliers)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-supplier-detail.png`,
      fullPage: false,
    });
  });

  test("/admin/customers liste → ilk müşteriye git", async ({ page }) => {
    const resp = await page.goto("/admin/customers");
    if ((resp?.status() ?? 0) >= 500) {
      throw new Error("müşteriler listesi build error verdi");
    }
    const link = page.locator("a[href^='/admin/customers/']:not([href$='/new']):not([href$='/campaign'])").first();
    if ((await link.count()) === 0) {
      test.skip(true, "Liste boş veya auth gate aktif.");
      return;
    }
    await link.click();
    await expect(page).toHaveURL(/\/admin\/(login|customers)/);
    await page.screenshot({
      path: `${test.info().outputDir}/admin-customer-detail.png`,
      fullPage: false,
    });
  });
});
