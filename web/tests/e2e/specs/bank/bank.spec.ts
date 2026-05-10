import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb } from "../../helpers/db";

test.describe("Bank reconciliation", () => {
  test("/admin/bank stats + simülatör paneli yüklenir", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.bank);
    await expect(
      authedPage.getByRole("heading", { name: /Banka işlemleri/i }),
    ).toBeVisible();
    await expect(authedPage.getByText(/Toplam işlem/i)).toBeVisible();
    await expect(
      authedPage.getByText(/Test Bankası — Havale simülatörü/i),
    ).toBeVisible();
  });

  test("/admin/bank/import sayfası 4 adımlı sihirbaz", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.bankImport);
    await expect(
      authedPage.getByRole("heading", { name: /Banka bilgisi/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("heading", { name: /CSV dosyası/i }),
    ).toBeVisible();
  });

  test("webhook idempotent çalışır (aynı reference 2. kez)", async ({
    request,
  }) => {
    const ref = e2eName("WebhookRef");
    const payload = {
      bank_name: "Test Bankası",
      reference: ref,
      transaction_date: new Date().toISOString(),
      amount_minor: 9999,
      currency: "TRY",
      description: `${e2eName("WebhookTx")} test ödeme`,
    };

    const r1 = await request.post("/api/webhooks/bank", { data: payload });
    expect(r1.ok()).toBe(true);
    const j1 = await r1.json();
    expect(j1.ok).toBe(true);
    expect(j1.bankTxId).toBeTruthy();

    const r2 = await request.post("/api/webhooks/bank", { data: payload });
    expect(r2.ok()).toBe(true);
    const j2 = await r2.json();
    expect(j2.idempotent).toBe(true);
    expect(j2.bankTxId).toBe(j1.bankTxId);

    // DB'de tek kayıt
    const db = getDb();
    const count = await db.bankTransaction.count({
      where: { bankName: "Test Bankası", reference: ref },
    });
    expect(count).toBe(1);
  });
});
