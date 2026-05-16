import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Anomaly banner (dashboard)", () => {
  test("dashboard mount'unda anomaly banner mock yanıtı render eder", async ({
    authedPage,
    mockAi,
  }) => {
    expect(mockAi.enabled).toBe(true);
    await authedPage.goto(ROUTES.dashboard);

    // Banner default collapsed — toggle button'a tıklayıp aç ki anomaly detayı render olsun.
    const toggle = authedPage.getByRole("button", {
      name: /AI Proaktif Uyarılar/i,
    });
    await expect(toggle).toBeVisible({ timeout: 15_000 });
    await toggle.click();

    // Mock yanıtımız bir anomaly döndürüyordu (MARKETING patlaması)
    const anomalyTitle = authedPage.getByText(/MARKETING %180 arttı/i);
    await expect(anomalyTitle).toBeVisible({ timeout: 10_000 });
  });
});
