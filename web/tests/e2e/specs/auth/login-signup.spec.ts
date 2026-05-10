/**
 * Auth UI testleri — login + signup formlarının kendisi.
 *
 * Vanilla @playwright/test kullanır (programmatic auth fixture YOK,
 * çünkü test ettiğimiz şey login akışının kendisi).
 */

import { expect, test } from "@playwright/test";
import { TEST_ADMIN } from "../../helpers/test-user";
import { ROUTES } from "../../helpers/routes";

test.describe("login form", () => {
  test("yanlış şifre inline hata ile reddedilir", async ({ page }) => {
    await page.goto(ROUTES.login);
    await expect(page.getByText(/Tekrar hoş geldin/)).toBeVisible();

    await page.getByLabel("E-posta").fill("nobody@example.com");
    await page.getByLabel("Şifre").fill("definitely-wrong-1234");
    await page.getByRole("button", { name: /^Giriş yap$/ }).click();

    await expect(
      page.getByText(/E-posta veya şifre hatalı/i),
    ).toBeVisible({ timeout: 10_000 });
  });

  test("admin başarılı login → /admin'e yönlendirilir", async ({ page }) => {
    await page.goto(ROUTES.login);

    await page.getByLabel("E-posta").fill(TEST_ADMIN.email);
    await page.getByLabel("Şifre").fill(TEST_ADMIN.password);
    await page.getByRole("button", { name: /^Giriş yap$/ }).click();

    await page.waitForURL(/\/admin(\/|$)/, { timeout: 15_000 });
    const firstName = TEST_ADMIN.name.split(" ")[0];
    await expect(
      page.getByText(new RegExp(`Hoş geldin, ${firstName}`)),
    ).toBeVisible();
  });

  test("kayıt ol linkine tıklayınca /signup'a gider", async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.getByRole("link", { name: /^Kayıt ol$/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.getByText(/Yeni hesap oluştur/)).toBeVisible();
  });
});

test.describe("signup form", () => {
  test("zayıf şifre client-side engellenir", async ({ page }) => {
    await page.goto(ROUTES.signup);

    await page.getByLabel("Ad Soyad").fill("Ada Lovelace");
    await page.getByLabel("E-posta").fill("ada@example.com");
    await page.getByLabel("Şifre").fill("short");
    await page.getByRole("button", { name: /^Hesap oluştur$/ }).click();

    // HTML minLength engeller, action ateşlenmez
    await expect(page).toHaveURL(/\/signup$/);
  });
});
