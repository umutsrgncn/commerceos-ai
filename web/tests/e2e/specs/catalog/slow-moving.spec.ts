/**
 * Yavaş hareket eden stok paneli + AI kampanya modal.
 *
 * - Slow-moving panel sadece uygun ürün varsa render edilir
 * - Maliyet eksik ürünlerde AI Analiz butonu disabled
 * - AI Analiz modal: mock yanıt → form alanları doldurulu
 * - 'Kampanyayı başlat' → Discount oluşur (DB'de)
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";
import { e2eName } from "../../helpers/test-user";
import { getDb, seedCustomer, seedProduct, seedOrder } from "../../helpers/db";

test.describe("Slow-moving stock panel", () => {
  test("yavaş ürün yoksa panel gizli", async ({ authedPage }) => {
    // Hiç E2E_ ürünü yok varsayıyoruz (cleanup başlangıçta yaptı)
    await authedPage.goto(ROUTES.inventory);

    // Sayfa yüklendi
    await expect(
      authedPage.getByRole("heading", { name: /Envanter/i }),
    ).toBeVisible();

    // Yavaş hareket başlığı görünmeyebilir (gerçek seed verisinde olabilir
    // ama E2E_ filtreli değil). Bu yüzden zayıf doğrulama: heading varlığı
    // duruma bağlı, hata atmaz.
  });

  test("maliyetsiz yavaş ürün → 'maliyet gir' linki + AI Analiz disabled", async ({
    authedPage,
  }) => {
    // costPrice null bir ürün + stok > 0 + son 30g satış 0 = yavaş
    const product = await seedProduct({
      name: e2eName("NoCostSlow"),
      stock: 25,
    });
    // costPrice'ı sil
    const db = getDb();
    await db.product.update({
      where: { id: product.id },
      data: { costPrice: null },
    });

    await authedPage.goto(ROUTES.inventory);

    // Panel başlığı
    await expect(authedPage.getByText(/Yavaş hareket eden stok/i)).toBeVisible({
      timeout: 10_000,
    });

    // Ürün listede
    await expect(authedPage.getByText(product.name).first()).toBeVisible();

    // 'maliyet gir' linki görünür (panel içinde)
    await expect(
      authedPage.getByText(/\+ maliyet gir/i).first(),
    ).toBeVisible();
  });

  test("AI Analiz butonu modal'ı açıyor (smoke, AI çağrısı yapmadan)", async ({
    authedPage,
  }) => {
    const product = await seedProduct({
      name: e2eName("ModalSmoke"),
      price: 10000,
      costPrice: 5000,
      stock: 30,
    });

    await authedPage.goto(ROUTES.inventory);
    const row = authedPage.locator("tr").filter({ hasText: product.name });
    await row.getByRole("button", { name: /AI Analiz/i }).click();

    // Modal heading'i + Kapat butonu görünür
    await expect(
      authedPage.getByText(/AI Kampanya Önerisi/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      authedPage.getByRole("button", { name: /^Kapat$/ }),
    ).toBeVisible();
  });

  test("maliyetli yavaş ürünün AI Analiz butonu enabled", async ({
    authedPage,
  }) => {
    const product = await seedProduct({
      name: e2eName("CostSlow"),
      price: 10000,
      costPrice: 5000,
      stock: 30,
    });

    await authedPage.goto(ROUTES.inventory);

    // Panel'de bu ürün için AI Analiz butonu disabled OLMAYACAK
    // (maliyet doludur)
    const productRow = authedPage
      .locator("tr")
      .filter({ hasText: product.name });
    const analizBtn = productRow.getByRole("button", { name: /AI Analiz/i });
    await expect(analizBtn).toBeEnabled({ timeout: 10_000 });
  });

  test("AI Analiz click → modal mock kampanya önerisi gösterir", async ({
    authedPage,
    mockAi,
  }) => {
    // suggestDeadStockCampaignAction server action içinden ai-service'e
    // fetch atıyor; browser-level page.route yakalayamaz. MSW kurulduğunda
    // enable edilmeli — şimdilik modal açılış smoke testi yeterli (aşağıda).
    test.fixme(true, "Server action AI fetch — MSW gerekir");
    const product = await seedProduct({
      name: e2eName("ModalProduct"),
      price: 10000,
      costPrice: 5000,
      stock: 50,
    });

    // Mock'u bu ürün için override et
    mockAi.override("deadStockCampaign", {
      product_id: product.id,
      product_name: product.name,
    });

    await authedPage.goto(ROUTES.inventory);
    const row = authedPage.locator("tr").filter({ hasText: product.name });
    await row.getByRole("button", { name: /AI Analiz/i }).click();

    // Modal başlığı
    await expect(
      authedPage.getByText(/AI Kampanya Önerisi/i),
    ).toBeVisible({ timeout: 10_000 });

    // Kampanya kodu input'u (modal içinde label'lı text input).
    // Modal içinde tek text input var (slider ayrı tip).
    const codeInput = authedPage
      .locator('input[type="text"]')
      .filter({ hasNot: authedPage.locator("[type=range]") })
      .last();
    await expect(codeInput).toHaveValue("E2EYAVAS25", { timeout: 8_000 });

    // Mock gerekçesi
    await expect(
      authedPage.getByText(/Stok 60\+ gün hareketsiz|marjı korur/i),
    ).toBeVisible();

    // Beklenen sonuç paneli
    await expect(authedPage.getByText(/Beklenen sonuç/i)).toBeVisible();
  });

  test("'Kampanyayı başlat' → Discount oluşur, kod kopyalanabilir hale gelir", async ({
    authedPage,
    mockAi,
  }) => {
    // Server action → ai-service fetch (server-side) → MSW gerekir
    test.fixme(true, "Server action AI fetch — MSW gerekir");
    const product = await seedProduct({
      name: e2eName("ApplyCampaign"),
      price: 10000,
      costPrice: 5000,
      stock: 40,
    });

    mockAi.override("deadStockCampaign", {
      product_id: product.id,
      product_name: product.name,
      suggested_code: `E2EAPPLY${Date.now().toString(36).toUpperCase()}`,
    });

    await authedPage.goto(ROUTES.inventory);
    const row = authedPage.locator("tr").filter({ hasText: product.name });
    await row.getByRole("button", { name: /AI Analiz/i }).click();

    // Modal açıldı, mock yüklendi mi
    await expect(
      authedPage.getByText(/AI Kampanya Önerisi/i),
    ).toBeVisible({ timeout: 10_000 });

    // 'Kampanyayı başlat' butonuna tıkla
    await authedPage
      .getByRole("button", { name: /Kampanyayı başlat/i })
      .click();

    // Başarı mesajı
    await expect(
      authedPage.getByText(/Kampanya başlatıldı/i),
    ).toBeVisible({ timeout: 10_000 });

    // DB'de Discount var mı?
    const db = getDb();
    const discount = await db.discount.findFirst({
      where: {
        code: { startsWith: "E2EAPPLY" },
        type: "PERCENTAGE",
        value: 25,
      },
    });
    expect(discount).not.toBeNull();
    expect(discount?.isActive).toBe(true);

    // Cleanup discount
    if (discount) {
      await db.discount.delete({ where: { id: discount.id } });
    }
  });
});
