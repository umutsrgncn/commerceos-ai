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
    // AI panel'leri var mı? (CardTitle "Finansal İçgörü" + "AI" rozeti — heading role'de "AI" görünmüyor)
    await expect(
      authedPage.getByText(/Finansal İçgörü/i).first(),
    ).toBeVisible();
    await expect(
      authedPage.getByText(/Cash flow tahmini/i).first(),
    ).toBeVisible();
  });
});
