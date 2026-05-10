import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Finance dashboard", () => {
  test("/admin/finance P&L + cashflow + AI panel render eder", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.finance);
    await expect(
      authedPage.getByRole("heading", { name: "Finans", exact: true }),
    ).toBeVisible();
    // AI panel'leri var mı?
    await expect(
      authedPage.getByRole("heading", { name: /AI Finansal İçgörü/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByText(/Cash flow tahmini/i).first(),
    ).toBeVisible();
  });
});
