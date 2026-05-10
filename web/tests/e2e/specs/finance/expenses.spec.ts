import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { seedExpense, getDb } from "../../helpers/db";

test.describe("Expenses", () => {
  test("/admin/expenses listesi yüklenir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.expenses);
    await expect(
      authedPage.getByRole("heading", { name: /Gider/i }),
    ).toBeVisible();
  });

  test("seed edilen gider listede görünür", async ({ authedPage }) => {
    const desc = e2eName("ExpenseListed");
    await seedExpense({ description: desc, amount: 12345 });

    await authedPage.goto(ROUTES.expenses);
    await expect(authedPage.getByText(desc).first()).toBeVisible();
  });

  test("yeni gider formu OCR kartı (mock AI) ile birlikte yüklenir", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.newExpense);
    await expect(authedPage.getByText(/Fişten otomatik doldur/i)).toBeVisible();
    await expect(authedPage.getByText(/Gider detayı/i)).toBeVisible();
  });

  test("manuel gider formu kaydeder (AI olmadan)", async ({ authedPage }) => {
    const desc = e2eName("ManualExpense");
    await authedPage.goto(ROUTES.newExpense);

    await authedPage.getByLabel(/Açıklama/i).fill(desc);
    await authedPage.getByLabel(/^Tutar$/i).fill("100.00");
    await authedPage.getByRole("button", { name: /Gideri kaydet|Kaydet/i }).first().click();

    await authedPage.waitForURL(/\/admin\/expenses/, { timeout: 15_000 });

    const db = getDb();
    const e = await db.expense.findFirst({ where: { description: desc } });
    expect(e).not.toBeNull();
  });
});
