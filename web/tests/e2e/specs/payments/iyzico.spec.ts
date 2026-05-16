/**
 * iyzico ödeme entegrasyonu smoke testleri.
 *
 * Gerçek iyzico'ya istek atmaz — UI rendering + PaymentCard state'lerini
 * + payment link oluşturma server action akışını doğrular.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer, seedOrder, seedProduct } from "../../helpers/db";

test.describe("iyzico Payment", () => {
  test("sipariş detayında PaymentCard sandbox rozetiyle görünür", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("PayCust") });
    const prod = await seedProduct({ name: e2eName("PayProd"), stock: 5 });
    const order = await seedOrder({
      customerId: cust.id,
      productId: prod.id,
      status: "PENDING",
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await expect(authedPage.getByText(/Online ödeme/i).first()).toBeVisible();
    await expect(authedPage.getByText(/SANDBOX/i).first()).toBeVisible();
    // Manuel "Ödeme linki oluştur" butonu kaldırıldı — artık Otopilot otomatik
    // tahsilat başlatıyor. Bekleme mesajı görünmeli.
    await expect(
      authedPage.getByText(/Otopilot açıkken sipariş onaylanınca otomatik tahsilat/i),
    ).toBeVisible();
  });

  test("test kart bilgileri accordion'da listelenir (sandbox)", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("CardCust") });
    const prod = await seedProduct({ name: e2eName("CardProd"), stock: 5 });
    const order = await seedOrder({
      customerId: cust.id,
      productId: prod.id,
      status: "PENDING",
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await authedPage.getByText(/Sandbox test kartları/i).click();
    await expect(authedPage.getByText(/5528 7900/)).toBeVisible();
  });

  test("CAPTURED ödeme varsa 'Tahsil edildi' kartı görünür", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("CapCust") });
    const prod = await seedProduct({ name: e2eName("CapProd"), stock: 5 });
    const order = await seedOrder({
      customerId: cust.id,
      productId: prod.id,
      status: "CONFIRMED",
    });

    const db = getDb();
    await db.payment.create({
      data: {
        orderId: order.id,
        gateway: "iyzico",
        status: "CAPTURED",
        amountMinor: order.total,
        currency: "TRY",
        paidAt: new Date(),
        gatewayPaymentId: `${e2eName("PayId")}`,
      },
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await expect(authedPage.getByText(/Tahsil edildi/i).first()).toBeVisible();
  });
});
