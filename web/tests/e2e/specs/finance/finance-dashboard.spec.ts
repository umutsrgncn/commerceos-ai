import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Finance dashboard", () => {
  test("/admin/finance P&L + cashflow + AI panel render eder", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.finance);
    await expect(
      authedPage.getByRole("heading", { name: /Finans/i }),
    ).toBeVisible();
    // AI panel'leri var mı?
    await expect(
      authedPage.getByText(/AI Finansal İçgörü/i),
    ).toBeVisible();
    await expect(
      authedPage.getByText(/Cash flow tahmini/i),
    ).toBeVisible();
  });
});
