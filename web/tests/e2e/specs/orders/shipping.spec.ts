/**
 * Kargo entegrasyonu (mock) testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer, seedOrder, seedProduct } from "../../helpers/db";

test.describe("Shipping", () => {
  test("CONFIRMED siparişin detayında 'Kargoya ver' formu var", async ({
    authedPage,
  }) => {
    const c = await seedCustomer({ name: e2eName("ShipCustomer") });
    const p = await seedProduct({ name: e2eName("ShipProduct") });
    const order = await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await expect(authedPage.getByText("Kargo", { exact: true })).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /Kargoya ver/i }),
    ).toBeVisible();
  });

  test("Kargoya ver butonu Order'a tracking no üretir + status SHIPPED", async ({
    authedPage,
  }) => {
    const c = await seedCustomer({ name: e2eName("ShipFlow") });
    const p = await seedProduct({ name: e2eName("ShipFlowProd") });
    const order = await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await authedPage
      .getByRole("button", { name: /Kargoya ver/i })
      .click();

    // Sonuç render: tracking no görünür
    await expect(authedPage.getByText(/Kargoda/i)).toBeVisible({
      timeout: 10_000,
    });
    await authedPage.waitForTimeout(800); // DB commit sync

    const db = getDb();
    const updated = await db.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("SHIPPED");
    expect(updated?.trackingNumber).toBeTruthy();
    expect(updated?.carrier).toBe("ARAS"); // default select
    expect(updated?.shippedAt).toBeTruthy();
  });

  test("'Teslim edildi' butonu DELIVERED'a çekiyor", async ({
    authedPage,
  }) => {
    const c = await seedCustomer({ name: e2eName("DeliverFlow") });
    const p = await seedProduct({ name: e2eName("DeliverProd") });
    const order = await seedOrder({
      customerId: c.id,
      productId: p.id,
      status: "CONFIRMED",
    });

    // Direkt DB'den SHIPPED yap
    const db = getDb();
    await db.order.update({
      where: { id: order.id },
      data: {
        status: "SHIPPED",
        carrier: "ARAS",
        trackingNumber: `AK${Date.now().toString(36).toUpperCase()}E2E`,
        shippedAt: new Date(),
      },
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await authedPage
      .getByRole("button", { name: /Teslim edildi olarak işaretle/i })
      .click();

    await expect(authedPage.getByText(/Teslim edildi/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await authedPage.waitForTimeout(800);

    const updated = await db.order.findUnique({ where: { id: order.id } });
    expect(updated?.status).toBe("DELIVERED");
    expect(updated?.deliveredAt).toBeTruthy();
  });
});
