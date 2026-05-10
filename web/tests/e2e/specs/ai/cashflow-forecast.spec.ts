import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Cashflow forecast (AI)", () => {
  // NOT: /api/ai/cashflow-forecast Next.js route handler içinde server-side
  // fetch ile ai-service'i çağırıyor. Browser-level page.route bunu
  // intercept edemez. Server-side AI mock için MSW veya AI_SERVICE_URL
  // env override gerekir — sonraki iterasyon. Şimdilik real AI ile çalışır.
  test.fixme(
    true,
    "Server-side AI fetch — MSW altyapısı veya AI_SERVICE_URL stub gerekir",
  );
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
