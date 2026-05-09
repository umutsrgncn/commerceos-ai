import { expect, test } from "@playwright/test";

test.describe("login form", () => {
  test("rejects mismatched credentials with an inline error", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText(/Tekrar hoş geldin/)).toBeVisible();

    await page.getByLabel("E-posta").fill("nobody@example.com");
    await page.getByLabel("Şifre").fill("definitely-wrong-1234");

    await page.getByRole("button", { name: /^Giriş yap$/ }).click();

    // Auth.js redirects back to /login on failure with the error param,
    // and our action surfaces a Turkish-friendly message.
    await expect(
      page.getByText(/E-posta veya şifre hatalı/i)
    ).toBeVisible({ timeout: 10_000 });
  });

  test("links to signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("link", { name: /^Kayıt ol$/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText(/Yeni hesap oluştur/)).toBeVisible();
  });
});

test.describe("signup form", () => {
  test("blocks weak passwords client-side", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel("Ad Soyad").fill("Ada Lovelace");
    await page.getByLabel("E-posta").fill("ada@example.com");
    await page.getByLabel("Şifre").fill("short");

    await page.getByRole("button", { name: /^Hesap oluştur$/ }).click();

    // The HTML minLength attribute prevents submission; the action never
    // fires so the URL stays on /signup.
    await expect(page).toHaveURL(/\/signup$/);
  });
});
