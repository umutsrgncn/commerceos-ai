/**
 * Ürün CRUD smoke testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedProduct } from "../../helpers/db";

test.describe("Products", () => {
  test("/admin/products listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.products);
    await expect(
      authedPage.getByRole("heading", { name: /^Ürünler/i }),
    ).toBeVisible();
  });

  test("ürün listesinde seed edilen ürün görünür", async ({ authedPage }) => {
    const product = await seedProduct({
      name: e2eName("Listed Product"),
      stock: 10,
    });

    await authedPage.goto(ROUTES.products);
    await expect(authedPage.getByText(product.name)).toBeVisible();
  });

  test("yeni ürün formu submit eder ve listede görünür", async ({
    authedPage,
  }) => {
    const name = e2eName("Created Product");
    // SKU regex: ^[A-Z0-9-]{2,40}$ — sadece büyük harf/rakam/tire
    const sku = `E2E-${Date.now().toString(36).toUpperCase()}`;

    await authedPage.goto(ROUTES.newProduct);
    await expect(
      authedPage.getByRole("heading", { name: /Yeni ürün/i }),
    ).toBeVisible();

    await authedPage.getByLabel(/Ürün adı/i).fill(name);
    await authedPage.getByLabel(/^SKU$/i).fill(sku);
    await authedPage.getByLabel(/Satış fiyatı/i).fill("99.90");
    await authedPage.getByRole("button", { name: /Ürünü oluştur/i }).click();

    // Action /admin/products/[cuid] detayına yönlendiriyor (cuid ~25 char)
    await authedPage.waitForURL(/\/admin\/products\/cm[a-z0-9]+$/, {
      timeout: 20_000,
    });
    await expect(authedPage.getByText(name).first()).toBeVisible();
  });

  test("ürün detay sayfası açılır ve form alanları doludur", async ({
    authedPage,
  }) => {
    const product = await seedProduct({ name: e2eName("Detail Test") });

    await authedPage.goto(ROUTES.productDetail(product.id));
    await expect(
      authedPage.getByRole("heading", { name: product.name }),
    ).toBeVisible();
    await expect(authedPage.getByText(product.sku)).toBeVisible();
  });
});
