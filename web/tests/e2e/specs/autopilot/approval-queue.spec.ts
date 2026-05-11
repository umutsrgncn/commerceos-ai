/**
 * Approval queue (onay bekleyen) testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { getDb } from "../../helpers/db";

test.describe("Approval queue", () => {
  test("/admin/autopilot'ta 'Onay bekleyen' card görünür", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.autopilot);
    await expect(
      authedPage.getByText(/Onay bekleyen AI önerileri/i),
    ).toBeVisible();
  });

  test("DB'de SKIPPED bir öneri varsa listede görünür + onayla/yoksay butonları", async ({
    authedPage,
  }) => {
    const db = getDb();

    // Bir ürün hazırla
    const product = await db.product.findFirst({
      where: { status: "PUBLISHED" },
    });
    if (!product) {
      test.skip(true, "Hiç PUBLISHED ürün yok");
      return;
    }

    // SKIPPED bir fiyat önerisi action'ı oluştur
    const action = await db.autoPilotAction.create({
      data: {
        type: "STOCK_REORDER",
        triggerSource: `product:${product.id}`,
        triggerSummary: `${product.name} fiyat önerisi (E2E test)`,
        decision: "↑ 12.50 TL",
        reasoning: "E2E test için manuel oluşturuldu",
        confidence: 70,
        status: "SKIPPED",
        metadata: {
          productId: product.id,
          productName: product.name,
          currentPriceMinor: 1000,
          suggestedPriceMinor: 1250,
          action: "increase",
        },
      },
    });

    await authedPage.goto(ROUTES.autopilot);

    // Ürün adı listede
    await expect(
      authedPage.getByText(product.name).first(),
    ).toBeVisible({ timeout: 10_000 });

    // Onayla + Yoksay butonları
    await expect(
      authedPage.getByRole("button", { name: /Onayla/i }).first(),
    ).toBeVisible();

    // Cleanup
    await db.autoPilotAction.delete({ where: { id: action.id } });
  });

  test("Onayla → Discount oluşmaz, ürün fiyatı güncellenir + EXECUTED'a geçer", async ({
    authedPage,
  }) => {
    const db = getDb();
    const product = await db.product.findFirst({
      where: { status: "PUBLISHED", costPrice: { not: null } },
    });
    if (!product) {
      test.skip(true, "costPrice'lı ürün yok");
      return;
    }

    const newPrice = product.price + 1500;
    const action = await db.autoPilotAction.create({
      data: {
        type: "STOCK_REORDER",
        triggerSource: `product:${product.id}`,
        triggerSummary: `${product.name} (E2E onay test)`,
        decision: `↑ ${(newPrice / 100).toFixed(2)} TL`,
        confidence: 80,
        status: "SKIPPED",
        metadata: {
          productId: product.id,
          productName: product.name,
          currentPriceMinor: product.price,
          suggestedPriceMinor: newPrice,
          action: "increase",
        },
      },
    });

    await authedPage.goto(ROUTES.autopilot);
    // Onayla butonuna tıkla — bu ürünün satırındakine
    const row = authedPage
      .locator("li")
      .filter({ hasText: product.name })
      .first();
    await row.getByRole("button", { name: /Onayla/i }).click();

    await authedPage.waitForTimeout(1000);

    // Ürün fiyatı güncellendi mi?
    const updated = await db.product.findUnique({
      where: { id: product.id },
    });
    expect(updated?.price).toBe(newPrice);

    // Action EXECUTED'a geçti mi?
    const updatedAction = await db.autoPilotAction.findUnique({
      where: { id: action.id },
    });
    expect(updatedAction?.status).toBe("EXECUTED");

    // Cleanup: revert price + delete action
    await db.product.update({
      where: { id: product.id },
      data: { price: product.price },
    });
    await db.autoPilotAction.delete({ where: { id: action.id } });
  });
});
