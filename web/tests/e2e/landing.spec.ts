import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("renders hero copy and CTA", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: /modern commerce/i })
    ).toBeVisible();

    await expect(page.getByText(/Powered by Gemini/i)).toBeVisible();

    const cta = page.getByRole("link", { name: /Get started/i });
    await expect(cta).toBeVisible();

    await cta.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
