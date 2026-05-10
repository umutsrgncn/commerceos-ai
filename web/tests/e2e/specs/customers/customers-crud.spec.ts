import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { seedCustomer } from "../../helpers/db";

test.describe("Customers CRUD", () => {
  test("/admin/customers listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.customers);
    await expect(
      authedPage.getByRole("heading", { name: /Müşteriler/i }),
    ).toBeVisible();
  });

  test("seed edilen müşteri listede görünür", async ({ authedPage }) => {
    const c = await seedCustomer({
      name: e2eName("ListCustomer"),
    });
    await authedPage.goto(ROUTES.customers);
    await expect(authedPage.getByText(c.name)).toBeVisible();
  });

  test("yeni müşteri formu submit eder", async ({ authedPage }) => {
    const name = e2eName("CreatedCustomer");
    const email = `e2e_form_${Date.now()}@example.com`;

    await authedPage.goto(ROUTES.newCustomer);
    await authedPage.getByLabel(/Ad Soyad/i).fill(name);
    await authedPage.getByLabel(/E-posta/i).fill(email);
    // Sticky bottom action bar'dan kaydet
    const saveBtn = authedPage.getByRole("button", {
      name: /Müşteriyi ekle|Kaydet/i,
    });
    await saveBtn.first().click();

    await authedPage.waitForURL(/\/admin\/customers/, { timeout: 15_000 });
    await authedPage.goto(ROUTES.customers);
    await expect(authedPage.getByText(name)).toBeVisible();
  });

  test("müşteri detay sayfası avatar + LTV kartlarını gösterir", async ({
    authedPage,
  }) => {
    const c = await seedCustomer({ name: e2eName("DetailCustomer") });
    await authedPage.goto(ROUTES.customerDetail(c.id));

    await expect(
      authedPage.getByRole("heading", { name: c.name }),
    ).toBeVisible();
    await expect(authedPage.getByText(/Yaşam boyu değer/i)).toBeVisible();
  });
});
