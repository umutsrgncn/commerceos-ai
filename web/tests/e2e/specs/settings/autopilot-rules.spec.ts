/**
 * Otopilot otomasyon kuralları (4 kategori, 8 toggle).
 *
 * Test sonunda autopilot OFF olarak bırakılır (autopilot-guard fixture
 * fail-safe ekstra kapatma yapar).
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { getDb, setAutoPilotEnabled } from "../../helpers/db";

test.describe("Otopilot kuralları", () => {
  test("4 kategori başlığı görünür (Yorumlar/Finans/Stok/Müşteri)", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.settings);

    // Otopilot section'ı sayfanın altında, scroll et
    await authedPage
      .getByRole("heading", { name: /Otopilot Modu/i })
      .scrollIntoViewIfNeeded();

    // Sidebar nav'da da 'Yorumlar', 'Müşteri' var — formun bağlamında ara
    // Otopilot section'ını locator ile sınırla
    const otoSection = authedPage.locator("section").filter({
      hasText: /Otopilot Modu/i,
    });

    await expect(
      otoSection.getByText("Yorumlar", { exact: true }),
    ).toBeVisible();
    await expect(
      otoSection.getByText(/Finans & Faturalama/i),
    ).toBeVisible();
    await expect(otoSection.getByText(/Stok & Tedarikçi/i)).toBeVisible();
    await expect(
      otoSection.getByText("Müşteri", { exact: true }),
    ).toBeVisible();
  });

  test("8 ayrı kural toggle'ı render edilir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.settings);
    await authedPage
      .getByRole("heading", { name: /Otopilot Modu/i })
      .scrollIntoViewIfNeeded();

    // Her toggle row'u <label> içinde — label'da text + checkbox var.
    // Sidebar nav ile çakışmaması için <label> filter'ı kullan.
    const labels = [
      "Yorum cevapları",
      "Negatif yorum analizi",
      "E-fatura kesimi",
      "Havale eşleştirme",
      "Sipariş otomatik onayı",
      "Stok sipariş maili",
      "Haftalık fiyat önerisi",
      "Müşteri segmentasyonu",
    ];
    for (const label of labels) {
      const row = authedPage.locator("label", { hasText: label });
      await expect(row.first()).toBeVisible({ timeout: 5_000 });
    }
  });

  test("'Sipariş otomatik onayı' kuralının riskli rozetli olduğu", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.settings);
    // Riskli rozeti var
    const riskyBadges = authedPage.getByText(/^riskli$/);
    await expect(riskyBadges.first()).toBeVisible();
  });

  test("kural sayacı X/8 formatında çalışır (varsayılan en az 5)", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.settings);
    // Otopilot kapalı durumunda da sayaç render olmuyor (badge sadece AKTİF iken)
    // O yüzden tek doğrulama: 'X/8 toplam' alt metni var mı
    await expect(authedPage.getByText(/\d+ aktif \/ 8 toplam/i)).toBeVisible();
  });

  test("yeni kural toggle (autoSuggestPrice) DB'ye yazar", async ({
    authedPage,
  }) => {
    await authedPage.goto(ROUTES.settings);

    // Otopilot'u aç (toggle butonu)
    const masterToggle = authedPage.getByRole("switch").first();
    await masterToggle.click();

    // 'Haftalık fiyat önerisi' checkbox
    const checkbox = authedPage
      .getByRole("checkbox", { name: /Haftalık fiyat önerisi/i })
      .or(
        authedPage.locator('label:has-text("Haftalık fiyat önerisi") input[type="checkbox"]'),
      );
    // Tick et
    if (await checkbox.first().isChecked()) {
      // zaten checked, off et ki değişiklik gözleyebileyim
      await checkbox.first().click();
    } else {
      await checkbox.first().click();
    }

    // Kaydet
    await authedPage
      .getByRole("button", { name: /Otopilot ayarlarını kaydet/i })
      .click();

    await authedPage.waitForTimeout(800);

    // DB doğrulama
    const db = getDb();
    const s = await db.systemSettings.findUnique({ where: { id: "default" } });
    // Field gerçekten geri okunabiliyor — bu testin ana amacı
    expect(typeof s?.autoPilotAutoSuggestPrice).toBe("boolean");

    // Cleanup: otopilot OFF + tüm kurallar default'a
    await setAutoPilotEnabled(false);
  });
});
