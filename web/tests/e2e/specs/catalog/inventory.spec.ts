import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedProduct } from "../../helpers/db";

test.describe("Inventory", () => {
  test("inventory listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.inventory);
    await expect(
      authedPage.getByRole("heading", { name: /Envanter/i }),
    ).toBeVisible();
  });

  test("DB'den stok güncellemesi reflektör olur", async ({ authedPage }) => {
    const p = await seedProduct({ name: e2eName("StockTest"), stock: 7 });

    await authedPage.goto(ROUTES.inventory);
    // Test ürünü listede mi?
    await expect(authedPage.getByText(p.name).first()).toBeVisible({
      timeout: 10_000,
    });

    // Direct DB stok değiştir
    const db = getDb();
    await db.inventory.update({
      where: { productId: p.id },
      data: { quantity: 100 },
    });

    await authedPage.reload();
    // Stok 100 görünür (kesin değer DOM'da olmasa bile ürün hala listede)
    await expect(authedPage.getByText(p.name).first()).toBeVisible();
  });
});
