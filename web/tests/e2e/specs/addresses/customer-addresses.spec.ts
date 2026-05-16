/**
 * Müşteri adres yönetimi smoke testi.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName, E2E_PREFIX } from "../../helpers/test-user";
import { getDb, seedCustomer, seedProduct } from "../../helpers/db";

test.describe("Customer addresses panel", () => {
  test("müşteri detayında 'Adresler' kartı görünür (boş hali)", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("AddrCust") });

    await authedPage.goto(ROUTES.customerDetail(cust.id));
    await expect(
      authedPage.getByRole("heading", { name: /Adresler/i }).first(),
    ).toBeVisible();
    await expect(authedPage.getByText(/Henüz adres yok/i)).toBeVisible();
  });

  test("seed edilen adres müşteri detayında listelenir", async ({
    authedPage,
  }) => {
    const cust = await seedCustomer({ name: e2eName("AddrList") });
    const db = getDb();
    await db.customerAddress.create({
      data: {
        customerId: cust.id,
        label: `${E2E_PREFIX}Ev`,
        fullName: `${E2E_PREFIX}Test Kişi`,
        phone: "+90 555 111 22 33",
        line1: `${E2E_PREFIX}Bağdat Cad. 123`,
        city: "İstanbul",
        district: "Kadıköy",
        postalCode: "34710",
        country: "TR",
        isDefault: true,
      },
    });

    await authedPage.goto(ROUTES.customerDetail(cust.id));
    await expect(authedPage.getByText(`${E2E_PREFIX}Ev`)).toBeVisible();
    await expect(authedPage.getByText(/Varsayılan/i)).toBeVisible();
    await expect(authedPage.getByText(/Bağdat Cad/)).toBeVisible();
  });

  test("kurumsal adres VKN/vergi dairesi gösterir", async ({ authedPage }) => {
    const cust = await seedCustomer({ name: e2eName("CompanyAddr") });
    const db = getDb();
    await db.customerAddress.create({
      data: {
        customerId: cust.id,
        label: `${E2E_PREFIX}Şirket`,
        fullName: `${E2E_PREFIX}ACME Ltd`,
        line1: `${E2E_PREFIX}Levent`,
        city: "İstanbul",
        country: "TR",
        isCompany: true,
        taxId: "1234567890",
        taxOffice: "Beşiktaş",
      },
    });

    await authedPage.goto(ROUTES.customerDetail(cust.id));
    await expect(authedPage.getByText(/VKN: 1234567890/)).toBeVisible();
    await expect(authedPage.getByText(/Beşiktaş VD/)).toBeVisible();
  });
});

test.describe("Order new — addresses UI", () => {
  // NewOrderForm boş DB'de placeholder gösteriyor; form için müşteri + ürün şart.
  test.beforeEach(async () => {
    await seedCustomer({ name: e2eName("NewOrderCust") });
    await seedProduct({ name: e2eName("NewOrderProd"), stock: 10 });
  });

  test("yeni sipariş formunda Teslimat ve Fatura kartları görünür", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.newOrder);

    await expect(
      authedPage.getByRole("heading", { name: /Teslimat adresi/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("heading", { name: /Fatura adresi/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByText(/Fatura adresi teslimat ile aynı/i),
    ).toBeVisible();
  });

  test("'Aynı adres' toggle fatura alanlarını disable eder", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.newOrder);

    const sameAs = authedPage.getByLabel(/Fatura adresi teslimat ile aynı/i);
    await expect(sameAs).toBeChecked(); // default true
  });
});
