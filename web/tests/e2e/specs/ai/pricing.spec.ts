import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { seedProduct, getDb } from "../../helpers/db";

test.describe("AI Pricing card", () => {
  test("maliyetli üründe öneri al → fiyat tile'ları + reasoning", async ({
    authedPage,
    mockAi,
  }) => {
    // suggestPriceAction server action içinden ai-service'e fetch atıyor;
    // browser-level mock yakalayamaz. MSW kurulduğunda enable edilmeli.
    test.fixme(true, "Server action AI fetch — MSW gerekir");
    expect(mockAi.enabled).toBe(true);
    const product = await seedProduct({
      name: e2eName("PricingProduct"),
      price: 10000,
      costPrice: 5000,
    });

    // Mock'u placeholder ile değil bu ürünle uyumlu hale getir
    mockAi.override("pricingSuggest", {
      product_id: product.id,
      product_name: product.name,
    });

    await authedPage.goto(ROUTES.productDetail(product.id));
    await expect(
      authedPage.getByText(/AI Fiyat Önerisi/i),
    ).toBeVisible();

    await authedPage
      .getByRole("button", { name: /Öneri al/i })
      .click();

    // Mock reasoning text
    await expect(
      authedPage.getByText(/Mevcut marj iyi|fiyat artırış/i),
    ).toBeVisible({ timeout: 15_000 });

    // 'Bu fiyatı uygula' butonuna bas → DB'de fiyat değişmeli
    await authedPage
      .getByRole("button", { name: /Bu fiyatı uygula/i })
      .click();

    await expect(
      authedPage.getByText(/Yeni fiyat uygulandı/i),
    ).toBeVisible({ timeout: 10_000 });

    const db = getDb();
    const updated = await db.product.findUnique({
      where: { id: product.id },
    });
    expect(updated?.price).toBe(11500); // mock yanıttan
  });

  test("maliyet yoksa amber uyarı kartı görünür", async ({ authedPage }) => {
    const product = await seedProduct({
      name: e2eName("NoCostProduct"),
      price: 10000,
      costPrice: undefined as unknown as number, // explicit null'a yaklaşan
    });
    // costPrice'ı sil
    const db = getDb();
    await db.product.update({
      where: { id: product.id },
      data: { costPrice: null },
    });

    await authedPage.goto(ROUTES.productDetail(product.id));
    await expect(
      authedPage.getByText(/maliyet/i).first(),
    ).toBeVisible();
  });
});
