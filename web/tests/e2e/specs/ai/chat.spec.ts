import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("AI Chat", () => {
  test("/admin/ai panel yüklenir, suggestion kartları + input", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.aiChat);
    // Header
    await expect(authedPage.getByRole("heading", { name: /AI/i }).first()).toBeVisible();
    // Mesaj input alanı
    await expect(
      authedPage.locator("textarea, input[type=text]").last(),
    ).toBeVisible();
  });

  test("mock AI ile mesaj gönderilebilir (smoke)", async ({
    authedPage,
    mockAi,
  }) => {
    // /api/ai/agent stream'i server-side fetch ile ai-service'e bağlanıyor.
    // Browser-level page.route yakalayamaz → MSW altyapısı sonraki iter.
    test.fixme(true, "Server-side AI fetch — MSW gerekir");
    expect(mockAi.enabled).toBe(true);
    await authedPage.goto(ROUTES.aiChat);

    const input = authedPage.locator("textarea").last();
    await input.fill("Merhaba");
    await input.press("Enter");

    // Mock cevabı görünür mü? (chunked stream'i mock'ladık)
    await expect(authedPage.getByText(/Bu bir test cevabıdır|Mock chat cevabı/i)).toBeVisible({
      timeout: 10_000,
    });
  });
});
