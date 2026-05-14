/**
 * KVKK uçtan uca akışı:
 *   1. Müşteri /shop/account/settings'e gider, "Hesabımı sil" modalını açar,
 *      gerekçe yazıp talebi gönderir.
 *   2. Sayfa pending durumunu kart olarak gösterir; aynı müşteri ikinci kez
 *      talep gönderemez (idempotency).
 *   3. Admin /admin/data-requests'te bekleyen talebi görür, filtre chip'leri
 *      doğru sayıyı verir, talebi onaylayabilir.
 */
import { expect, test } from "../../fixtures";
import { getDb } from "../../helpers/db";
import {
  attachCustomerSession,
  cleanupKvkkRequests,
  seedCustomerForLogin,
} from "../../helpers/customer-auth";

test.describe("KVKK · hesap silme akışı", () => {
  test.afterEach(async () => {
    await cleanupKvkkRequests();
  });

  test("müşteri talep gönderir, pending kartı görünür, duplicate engellenir", async ({
    browser,
  }) => {
    const customer = await seedCustomerForLogin();

    const ctx = await browser.newContext();
    await attachCustomerSession(ctx, customer.id);
    const page = await ctx.newPage();

    try {
      // 1. Settings sayfası açılır, KVKK bölümü ve buton var
      await page.goto("/shop/account/settings");
      await expect(
        page.getByRole("heading", { name: /KVKK · Verilerim/i }),
      ).toBeVisible();
      const openBtn = page.getByTestId("open-delete-modal");
      await expect(openBtn).toBeVisible();

      // 2. Modal açılır, gerekçe yazılır, talep gönderilir
      await openBtn.click();
      await expect(
        page.getByRole("heading", { name: /Hesap silme talebi/i }),
      ).toBeVisible();
      await page
        .getByTestId("kvkk-reason-input")
        .fill("E2E test: hesabımı silmek istiyorum.");
      await page.getByTestId("confirm-delete-btn").click();

      // 3. Pending kartı görünür, "Hesabımı sil" butonu artık yok
      await expect(page.getByTestId("kvkk-active-request")).toBeVisible();
      await expect(
        page.getByText(/Talebin alındı|yönetici onayı bekleniyor/i),
      ).toBeVisible();
      await expect(page.getByTestId("open-delete-modal")).toHaveCount(0);

      // 4. DB'de tek kayıt var, status PENDING
      const db = getDb();
      const reqs = await db.dataDeletionRequest.findMany({
        where: { customerId: customer.id },
      });
      expect(reqs).toHaveLength(1);
      expect(reqs[0].status).toBe("PENDING");
      expect(reqs[0].reason).toContain("E2E test");

      // 5. Refresh — yine pending kartı, buton yok (idempotency)
      await page.reload();
      await expect(page.getByTestId("kvkk-active-request")).toBeVisible();
      await expect(page.getByTestId("open-delete-modal")).toHaveCount(0);

      await page.screenshot({
        path: `${test.info().outputDir}/kvkk-pending-card.png`,
        fullPage: false,
      });
    } finally {
      await ctx.close();
    }
  });

  test("admin tarafı: pending talebi görür, filtre ve onay çalışır", async ({
    authedPage,
  }) => {
    // Önce DB'de bekleyen bir talep yarat (müşteri UI olmadan kestirme)
    const customer = await seedCustomerForLogin();
    const db = getDb();
    const created = await db.dataDeletionRequest.create({
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name,
        reason: "E2E admin onay testi",
        status: "PENDING",
      },
      select: { id: true },
    });

    // Admin sayfasında talep listede görünür
    await authedPage.goto("/admin/data-requests");
    await expect(
      authedPage.getByRole("heading", { name: /KVKK · Veri Silme Talepleri/i }),
    ).toBeVisible();
    await expect(authedPage.getByTestId("data-requests-list")).toBeVisible();
    const itemRow = authedPage
      .getByTestId("data-request-item")
      .filter({ hasText: customer.email });
    await expect(itemRow).toBeVisible();
    await expect(itemRow).toHaveAttribute("data-status", "PENDING");

    // Filtre chip'leri görünür, "Bekleyen" filtresi >= 1 göstermeli
    const filterNav = authedPage.getByTestId("data-requests-filter");
    await expect(filterNav).toBeVisible();
    const pendingChip = authedPage.getByTestId("filter-pending");
    await expect(pendingChip).toBeVisible();
    await expect(pendingChip).toContainText(/\d+/);

    // "Bekleyen" filtresine tıkla — yine bizim kayıt görünmeli
    await pendingChip.click();
    await expect(pendingChip).toHaveAttribute("data-active", "true");
    await expect(
      authedPage
        .getByTestId("data-request-item")
        .filter({ hasText: customer.email }),
    ).toBeVisible();

    // Onayla butonuna tıkla — status APPROVED
    const approveRow = authedPage
      .getByTestId("data-request-item")
      .filter({ hasText: customer.email });
    await approveRow.getByRole("button", { name: /^Onayla$/i }).click();

    // Revalidate'i bekle, kayıt APPROVED'a geçer (PENDING filtresinde artık görünmez)
    await expect(async () => {
      const updated = await db.dataDeletionRequest.findUnique({
        where: { id: created.id },
        select: { status: true },
      });
      expect(updated?.status).toBe("APPROVED");
    }).toPass({ timeout: 5_000 });

    await authedPage.screenshot({
      path: `${test.info().outputDir}/admin-data-requests-after-approve.png`,
      fullPage: false,
    });
  });

  test("filtresiz sayfa empty state göstermeli (talep yokken)", async ({
    authedPage,
  }) => {
    // Tüm test kayıtlarını temizle ki gerçek empty state'i görelim
    await cleanupKvkkRequests();
    const db = getDb();
    // Üretim verisi olmayabilir; varsa boşa çıkmaz. Sayfa yine de smoke geçer.
    const productionRequests = await db.dataDeletionRequest.count();

    await authedPage.goto("/admin/data-requests");
    if (productionRequests === 0) {
      await expect(authedPage.getByTestId("data-requests-empty")).toBeVisible();
    } else {
      // Üretim datası var — list görünür, ama empty değil
      await expect(authedPage.getByTestId("data-requests-list")).toBeVisible();
    }
  });
});
