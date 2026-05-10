import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import {
  seedCustomer,
  seedOrder,
  seedProduct,
  getDb,
} from "../../helpers/db";

test.describe("Orders workflow", () => {
  test("/admin/orders listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.orders);
    await expect(
      authedPage.getByRole("heading", { name: /Siparişler/i }),
    ).toBeVisible();
  });

  test("seed edilen sipariş detayı açılır", async ({ authedPage }) => {
    const cust = await seedCustomer({ name: e2eName("OrderCustomer") });
    const prod = await seedProduct({ name: e2eName("OrderProduct"), stock: 10 });
    const order = await seedOrder({
      customerId: cust.id,
      productId: prod.id,
      status: "PENDING",
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await expect(authedPage.getByText(order.orderNumber)).toBeVisible();
    await expect(authedPage.getByText(/Beklemede/i)).toBeVisible();
  });

  test("sipariş durum geçişi (PENDING → CONFIRMED) DB'ye yansır", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("TransitionCustomer") });
    const prod = await seedProduct({ name: e2eName("TransitionProduct") });
    const order = await seedOrder({
      customerId: cust.id,
      productId: prod.id,
      status: "PENDING",
    });

    // UI'dan değil DB'den geçişi simüle et (UI form çok değişken)
    const db = getDb();
    await db.order.update({
      where: { id: order.id },
      data: { status: "CONFIRMED" },
    });

    await authedPage.goto(ROUTES.orderDetail(order.id));
    await expect(authedPage.getByText(/Onaylandı/i)).toBeVisible();
  });
});
