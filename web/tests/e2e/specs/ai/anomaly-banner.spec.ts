import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Anomaly banner (dashboard)", () => {
  test("dashboard mount'unda anomaly banner mock yanıtı render eder", async ({
    authedPage,
    mockAi,
  }) => {
    expect(mockAi.enabled).toBe(true);
    await authedPage.goto(ROUTES.dashboard);

    // Banner başlığı veya emerald 'temiz' kart
    const banner = authedPage.getByText(/AI Proaktif Uyarılar|Anormallik yok/i);
    await expect(banner.first()).toBeVisible({ timeout: 15_000 });

    // Mock yanıtımız bir anomaly döndürüyordu (MARKETING patlaması)
    const anomalyTitle = authedPage.getByText(/MARKETING %180 arttı/i);
    await expect(anomalyTitle).toBeVisible({ timeout: 10_000 });
  });
});
