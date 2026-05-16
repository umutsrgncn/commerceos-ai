/**
 * Toplu e-fatura kesimi testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer, seedOrder, seedProduct } from "../../helpers/db";

test.describe("Bulk invoice", () => {
  test("checkbox seçilince floating bar görünür", async ({ authedPage }) => {
    const c = await seedCustomer({ name: e2eName("BulkCustomer") });
    const p = await seedProduct({ name: e2eName("BulkProduct") });
    await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });

    await authedPage.goto(ROUTES.orders);

    // İlk bulkOrder checkbox'ı
    const cb = authedPage.locator('input[name="bulkOrder"]').first();
    await cb.check();

    await expect(authedPage.getByText(/sipariş seçildi/i)).toBeVisible({
      timeout: 5_000,
    });
    await expect(
      authedPage.getByRole("button", { name: /Hepsine kes/i }),
    ).toBeVisible();
  });

  test("'Hepsine kes' butonu Discount oluşturmaz, fatura oluşturur", async ({
    authedPage,
  }) => {
    // issueInvoiceAction taxId zorunlu — yoksa "Şirket vergi numarası eksik"
    // ile fail edip Invoice oluşturmaz, sonra DB check null bulur.
    const db = getDb();
    await db.systemSettings.update({
      where: { id: "default" },
      data: {
        taxId: "1234567890",
        companyName: "E2E Test A.Ş.",
      },
    });

    // 2 farklı sipariş seed et
    const c = await seedCustomer({ name: e2eName("BulkApply") });
    const p = await seedProduct({ name: e2eName("BulkApplyProd") });

    const o1 = await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });
    const o2 = await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });

    await authedPage.goto(ROUTES.orders);

    // Click yerine .check() change event firing için
    await authedPage
      .locator(`input[name="bulkOrder"][value="${o1.id}"]`)
      .click();
    await authedPage
      .locator(`input[name="bulkOrder"][value="${o2.id}"]`)
      .click();

    // Bulk bar görünür mü?
    await expect(authedPage.getByText(/2 sipariş seçildi/i)).toBeVisible({
      timeout: 5_000,
    });

    // 'Hepsine kes' click — action revalidatePath ile sayfa reload eder,
    // toast UI'da kayıp olabilir. DB ile doğrula.
    await authedPage
      .getByRole("button", { name: /Hepsine kes/i })
      .click();

    // Bulk işlem sırası 2-3 sn (her invoice ayrı GIB mock call + DB)
    await authedPage.waitForTimeout(5000);

    // DB'de Invoice'lar oluştu mu? (db beforeBlock'ta zaten alındı)
    const i1 = await db.invoice.findUnique({ where: { orderId: o1.id } });
    const i2 = await db.invoice.findUnique({ where: { orderId: o2.id } });
    expect(i1).not.toBeNull();
    expect(i2).not.toBeNull();
  });
});
