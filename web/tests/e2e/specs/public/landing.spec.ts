import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero copy and CTA", async ({ page }) => {
    await page.goto("/");

    // Landing artık Türkçe — h1 "E-ticaretin AI ile yönetildiği..."
    await expect(
      page.getByRole("heading", { name: /E-ticaretin/i, level: 1 })
    ).toBeVisible();

    await expect(page.getByText(/Gemini/i).first()).toBeVisible();

    // CTA: "Demo panele git" → /login
    const cta = page.getByRole("link", { name: /Demo panele git/i }).first();
    await expect(cta).toBeVisible();

    await cta.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
