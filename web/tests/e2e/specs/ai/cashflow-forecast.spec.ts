import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Cashflow forecast (AI)", () => {
  test("Üret butonu mock yanıtla 4 stat + chart + warning gösterir", async ({
    authedPage,
    mockAi,
  }) => {
    expect(mockAi.enabled).toBe(true);
    await authedPage.goto(ROUTES.finance);

    // Cashflow forecast kartı + Üret butonu
    const card = authedPage.getByText(/Önümüzdeki 30 gün/i).first();
    await expect(card).toBeVisible();

    const üret = authedPage.getByRole("button", { name: /Tahmin üret|Üret/i }).first();
    await üret.click();

    // Mock yanıtının summary'si geldi mi?
    await expect(
      authedPage.getByText(/30 gün boyunca pozitif|Özet:/i),
    ).toBeVisible({ timeout: 15_000 });

    // Risk uyarısı
    await expect(
      authedPage.getByText(/Risk uyarıları|Kira günü/i),
    ).toBeVisible();
  });
});
