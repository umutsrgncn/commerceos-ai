/**
 * KVKK public sayfaları smoke testi (auth gerektirmez).
 */

import { test, expect } from "@playwright/test";

import { getDb } from "../../helpers/db";
import { E2E_PREFIX } from "../../helpers/test-user";

test.describe("KVKK public pages", () => {
  test("/privacy aydınlatma metni yüklenir", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: /Aydınlatma Metni/i }),
    ).toBeVisible();
    await expect(page.getByText(/6698 sayılı/i).first()).toBeVisible();
    // Default şablonda 7 başlık olmalı
    await expect(page.getByText(/VERİ SORUMLUSU/).first()).toBeVisible();
    await expect(page.getByText(/HAKLARINIZ/).first()).toBeVisible();
  });

  test("/data-deletion form alanları görünür", async ({ page }) => {
    await page.goto("/data-deletion");
    await expect(
      page.getByRole("heading", { name: /Veri Silme Talebi/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/E-posta/i)).toBeVisible();
    await expect(page.getByLabel(/Talep nedeni/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Veri silme talebi gönder/i }),
    ).toBeVisible();
  });

  test("data-deletion form gönderimi kayıt oluşturur ve teşekkür sayfasına gider", async ({
    page,
  }) => {
    const email = `e2e_kvkk_${Date.now()}@example.com`;

    await page.goto("/data-deletion");
    await page.getByLabel(/E-posta/i).fill(email);
    await page.getByLabel(/Ad Soyad/i).fill(`${E2E_PREFIX}KvkkUser`);
    await page.getByLabel(/Talep nedeni/i).fill(`${E2E_PREFIX}test reason`);

    await page
      .getByRole("button", { name: /Veri silme talebi gönder/i })
      .click();

    // Teşekkür durumu
    await expect(page).toHaveURL(/\/data-deletion\?submitted=1/);
    await expect(page.getByText(/Talebiniz alındı/i)).toBeVisible();

    // DB'de kayıt oluştu mu
    const db = getDb();
    const req = await db.dataDeletionRequest.findFirst({
      where: { customerEmail: email },
    });
    expect(req).not.toBeNull();
    expect(req?.status).toBe("PENDING");

    // Cleanup
    if (req) {
      await db.dataDeletionRequest.delete({ where: { id: req.id } });
      await db.activityLog.deleteMany({
        where: { action: "kvkk.deletion_requested", userName: email },
      });
    }
  });

  test("/privacy yürürlük tarihi var", async ({ page }) => {
    await page.goto("/privacy");
    // tr-TR locale: 10.05.2026 vs benzeri format
    await expect(
      page.getByText(/\d{1,2}\.\d{1,2}\.\d{4}/).first(),
    ).toBeVisible();
  });
});
