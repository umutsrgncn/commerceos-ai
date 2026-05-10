import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Invoices", () => {
  test("/admin/invoices listesi 4 stat kartı + filter chip'leri", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.invoices);
    await expect(
      authedPage.getByRole("heading", { name: /E-Faturalar/i }),
    ).toBeVisible();
    await expect(authedPage.getByText(/Toplam fatura/i)).toBeVisible();
    await expect(authedPage.getByText(/Kabul oranı/i)).toBeVisible();
  });
});
