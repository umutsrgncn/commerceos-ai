/**
 * Onboarding wizard testleri.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { getDb } from "../../helpers/db";

test.describe("Onboarding wizard", () => {
  test.beforeEach(async () => {
    // Her test öncesi onboarding'i sıfırla
    const db = getDb();
    await db.systemSettings.upsert({
      where: { id: "default" },
      update: { onboardingCompletedAt: null },
      create: { id: "default", onboardingCompletedAt: null },
    });
  });

  test.afterAll(async () => {
    // Test bitince onboarding'i completed olarak işaretle
    const db = getDb();
    await db.systemSettings.upsert({
      where: { id: "default" },
      update: { onboardingCompletedAt: new Date() },
      create: { id: "default", onboardingCompletedAt: new Date() },
    });
  });

  test("ilk girişte modal açılır + 'Bu turu atla' + Sonraki butonu var", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.dashboard);
    await expect(
      authedPage.getByText(/CommerceOS AI'ya hoş geldin/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      authedPage.getByRole("button", { name: /Bu turu atla/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /Sonraki/i }),
    ).toBeVisible();
  });

  test("Sonraki → 4 adım gez + Tamam ile DB'ye onboardingCompletedAt yazılır", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.dashboard);

    // Adım 1 → 2
    await authedPage.getByRole("button", { name: /Sonraki/i }).click();
    await expect(authedPage.getByText(/Şirket bilgilerini gir/i)).toBeVisible();

    // Adım 2 → 3
    await authedPage.getByRole("button", { name: /Sonraki/i }).click();
    await expect(authedPage.getByText(/İlk ürününü ekle/i)).toBeVisible();

    // Adım 3 → 4
    await authedPage.getByRole("button", { name: /Sonraki/i }).click();
    await expect(authedPage.getByText(/Otopilot'u tanı/i)).toBeVisible();

    // Adım 4: Tamam
    await authedPage.getByRole("button", { name: /Tamam/i }).click();

    await authedPage.waitForTimeout(1000);
    const db = getDb();
    const s = await db.systemSettings.findUnique({
      where: { id: "default" },
    });
    expect(s?.onboardingCompletedAt).not.toBeNull();
  });

  test("'Bu turu atla' tek tık ile kapat + DB'ye yazar", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.dashboard);
    await authedPage
      .getByRole("button", { name: /Bu turu atla/i })
      .click();

    await authedPage.waitForTimeout(800);
    const db = getDb();
    const s = await db.systemSettings.findUnique({
      where: { id: "default" },
    });
    expect(s?.onboardingCompletedAt).not.toBeNull();
  });

  test("onboarding tamamlandıktan sonra modal bir daha açılmaz", async ({
    authedPage,
  }) => {
    // Önce completed işaretle
    const db = getDb();
    await db.systemSettings.upsert({
      where: { id: "default" },
      update: { onboardingCompletedAt: new Date() },
      create: { id: "default", onboardingCompletedAt: new Date() },
    });

    await authedPage.goto(ROUTES.dashboard);
    await authedPage.waitForTimeout(500);
    await expect(
      authedPage.getByText(/CommerceOS AI'ya hoş geldin/i),
    ).not.toBeVisible();
  });
});
