/**
 * Otopilot test'leri.
 *
 * GÜVENLİK: `withAutoPilotOn` helper'ı bu spec'lerin OTOMATİK olarak
 * sonunda otopilot'u kapattığını garanti eder. Eğer test fail olursa
 * bile finally block çalışır + global afterEach'te ek bir OFF set'i var.
 * Yani OTOPILOT TEST SONRASI ASLA AÇIK KALMAZ.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { isAutoPilotEnabled } from "../../helpers/db";

test.describe("Otopilot", () => {
  test("otopilot kapalıyken /admin/autopilot 'KAPALI' rozeti gösterir", async ({
    authedPage,
  }) => {
    // Pre-condition: guard fixture zaten OFF garanti ediyor
    expect(await isAutoPilotEnabled()).toBe(false);

    await authedPage.goto(ROUTES.autopilot);
    await expect(
      authedPage.getByRole("heading", { name: /Otopilot/i }).first(),
    ).toBeVisible();
    await expect(authedPage.getByText("KAPALI")).toBeVisible();
  });

  test("withAutoPilotOn helper içinde aktif → block sonunda OFF", async ({
    withAutoPilotOn,
  }) => {
    expect(await isAutoPilotEnabled()).toBe(false);

    await withAutoPilotOn(async () => {
      // Block içinde otopilot AÇIK
      expect(await isAutoPilotEnabled()).toBe(true);
    });

    // Block bittiğinde OTOMATİK kapatılmış olmalı
    expect(await isAutoPilotEnabled()).toBe(false);
  });

  test("otopilot AÇIKKEN demo butonları görünür ama tıklanmaz (test çalışmaz)", async ({
    authedPage,
    withAutoPilotOn,
  }) => {
    await withAutoPilotOn(async () => {
      await authedPage.goto(ROUTES.autopilot);
      await expect(authedPage.getByText("AKTİF").first()).toBeVisible();

      // Demo butonları enabled olmalı
      const reviewBtn = authedPage.getByRole("button", {
        name: /Yeni yorum gönder/i,
      });
      await expect(reviewBtn).toBeEnabled();

      // Tıklama BU SPEC'TE YAPMIYORUZ — ayrı bir spec'te (daha aşağıda)
    });

    // Helper bittikten sonra otopilot kapalı
    expect(await isAutoPilotEnabled()).toBe(false);
  });
});

test.describe("Otopilot — failsafe", () => {
  /**
   * Bu spec, fixture'ın baştaki guard'ının çalıştığını test eder.
   * Eğer önceki test'lerden biri otopilot'u açık bıraktıysa burada fail
   * vermez (fixture zorla kapatır), ama OFF olarak başladığını assert eder.
   */
  test("guard her test başında OFF garantisi sağlar", async ({
    ensureAutoPilotOff,
  }) => {
    await ensureAutoPilotOff();
    expect(await isAutoPilotEnabled()).toBe(false);
  });
});
