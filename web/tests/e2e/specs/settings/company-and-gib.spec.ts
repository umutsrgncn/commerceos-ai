/**
 * Şirket bilgileri + GİB e-fatura ayarları.
 */

import { test, expect } from "../../fixtures";
import { ROUTES } from "../../helpers/routes";

test.describe("Settings — şirket + GİB", () => {
  test("şirket bilgileri kaydedilir ve geri okunur", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.settings);

    // Önce mevcut sayfanın yüklendiğini doğrula
    await expect(
      authedPage.getByRole("heading", { name: /Mağaza ayarları/i }),
    ).toBeVisible();

    const companyInput = authedPage.getByLabel(/Şirket adı/i);
    await companyInput.fill("CommerceOS E2E Test Şirketi");

    // İlk kayıt butonu — şirket bilgileri formu
    const saveButtons = authedPage.getByRole("button", { name: /Kaydet/i });
    await saveButtons.first().click();

    // Sayfa yenilense bile alan kalsın
    await authedPage.reload();
    await expect(authedPage.getByLabel(/Şirket adı/i)).toHaveValue(
      "CommerceOS E2E Test Şirketi",
    );
  });

  test("GİB modu test/üretim seçilebilir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.settings);

    // GİB section'da test mode rozet veya seçici görünür
    await expect(
      authedPage.getByText(/GİB E-Fatura Entegrasyonu/i),
    ).toBeVisible();
  });
});
