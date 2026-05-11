/**
 * Tekrarlayan gider (recurring expense) testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb } from "../../helpers/db";

test.describe("Recurring expense", () => {
  test("'Tekrarlananları üret' butonu /admin/expenses'da görünür", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.expenses);
    await expect(
      authedPage.getByRole("button", { name: /Tekrarlananları üret/i }),
    ).toBeVisible();
  });

  test("expense form'da 'Tekrarla' select'i var", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.newExpense);
    await expect(authedPage.getByLabel(/Tekrarla/i)).toBeVisible();
  });

  test("recurringRule template'i + 1 ay önce tarihi olan gider için generate yeni türev oluşturur", async ({
    authedPage,
  }) => {
    const db = getDb();
    const session = await db.user.findFirst({ where: { email: "demo@commerceos.dev" } });

    // 30 gün önceki tarihte MONTHLY template oluştur
    const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const template = await db.expense.create({
      data: {
        date: oldDate,
        amount: 500000, // 5000 TL
        currency: "TRY",
        category: "RENT",
        description: e2eName("MonthlyRent"),
        recurringRule: "MONTHLY",
        userId: session?.id ?? null,
      },
    });

    await authedPage.goto(ROUTES.expenses);
    await authedPage
      .getByRole("button", { name: /Tekrarlananları üret/i })
      .click();

    // Sonuç mesajı 'X gider üretildi' ya da '0 yeni gider' (vakti gelmemiş)
    await expect(
      authedPage.getByText(/üretildi|gider yok/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    // DB'de türev var mı?
    const children = await db.expense.findMany({
      where: { recurringParentId: template.id },
    });
    expect(children.length).toBeGreaterThanOrEqual(1);
  });
});
