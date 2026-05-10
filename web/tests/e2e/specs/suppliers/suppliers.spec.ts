import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedSupplier } from "../../helpers/db";

test.describe("Suppliers", () => {
  test("/admin/suppliers listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.suppliers);
    await expect(
      authedPage.getByRole("heading", { name: /Tedarikçiler/i }),
    ).toBeVisible();
  });

  test("seed edilen tedarikçi listede görünür", async ({ authedPage }) => {
    const s = await seedSupplier({ name: e2eName("ListedSupplier") });
    await authedPage.goto(ROUTES.suppliers);
    await expect(authedPage.getByText(s.name)).toBeVisible();
  });

  test("yeni tedarikçi formu kayıt eder", async ({ authedPage }) => {
    const name = e2eName("CreatedSupplier");
    const email = `e2e_supcreate_${Date.now()}@example.com`;

    await authedPage.goto(ROUTES.newSupplier);
    await authedPage.getByLabel(/Firma adı/i).fill(name);
    await authedPage.getByLabel(/E-posta/i).fill(email);
    // Sticky bottom action bar'daki Kaydet butonu (form submit)
    // Form'un kendi submit butonu (sticky bar) — text="Kaydet"
    await authedPage
      .getByRole("button", { name: /^Kaydet$/, exact: false })
      .last()
      .click();

    // Action navigate to /admin/suppliers
    await authedPage.waitForURL(/\/admin\/suppliers$/, { timeout: 15_000 });

    const db = getDb();
    const created = await db.supplier.findFirst({ where: { name } });
    expect(created).not.toBeNull();
  });
});
