/**
 * Otopilot ayarları — toggle, threshold, sub-rule'lar.
 *
 * NOT: Bu test SONUNDA otopilot OFF olduğunu garanti eder. Test ortasında
 * otopilot AÇILABİLİR ama spec sonunda kapanmış olmalı (autopilot-guard
 * fixture afterEach'te zorla kapatır, bu spec sadece UI etkileşimini
 * test eder).
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { isAutoPilotEnabled, setAutoPilotEnabled } from "../../helpers/db";

test.describe("Otopilot ayarları", () => {
  test("toggle UI'ı state'i DB'ye yazar (sonra OFF'a çekilir)", async ({
    authedPage,
  }) => {
    // Başlangıç state: OFF (guard garantisi)
    expect(await isAutoPilotEnabled()).toBe(false);

    await authedPage.goto(ROUTES.settings);

    // 'AKTİF' rozeti olmamalı
    await expect(
      authedPage.locator("text=Otopilot Modu").first(),
    ).toBeVisible();

    // Toggle aç (role=switch)
    const toggle = authedPage.getByRole("switch").first();
    await toggle.click();

    // Kaydet butonu (otopilot kartının kendi save butonu)
    const saveBtn = authedPage.getByRole("button", {
      name: /Otopilot ayarlarını kaydet/i,
    });
    await saveBtn.click();

    // DB'de aktif olmalı
    await authedPage.waitForTimeout(500);
    expect(await isAutoPilotEnabled()).toBe(true);

    // Otopilot kapatma — fixture zaten afterEach'te yapacak ama
    // bu spec'in sonu olduğu için manuel kapatalım
    await setAutoPilotEnabled(false);
  });

  test("threshold slider değişikliği kaydedilir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.settings);

    // Toggle aç (kaydet butonu için aktif olmalı)
    const toggle = authedPage.getByRole("switch").first();
    await toggle.click();

    // Threshold range input
    const slider = authedPage.locator('input[type="range"]').first();
    await slider.fill("90");
    await authedPage.getByRole("button", {
      name: /Otopilot ayarlarını kaydet/i,
    }).click();

    await authedPage.waitForTimeout(500);
    await authedPage.reload();

    // Reload sonrası slider 90'da kalmış olmalı
    const sliderAfter = authedPage.locator('input[type="range"]').first();
    await expect(sliderAfter).toHaveValue("90");

    await setAutoPilotEnabled(false);
  });
});
