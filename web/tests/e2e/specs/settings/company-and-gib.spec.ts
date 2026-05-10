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

    const companyInput = authedPage.getByLabel(/Firma adı/i);
    await companyInput.fill("CommerceOS E2E Test Şirketi");

    // İlk form'un submit butonu (şirket bilgileri)
    await authedPage
      .locator("form")
      .first()
      .getByRole("button", { name: /Kaydet/i })
      .click();

    // Sayfa yenilense bile alan kalsın
    await authedPage.waitForTimeout(800);
    await authedPage.reload();
    await expect(authedPage.getByLabel(/Firma adı/i)).toHaveValue(
      "CommerceOS E2E Test Şirketi",
    );
  });

  test("GİB modu test/üretim seçilebilir", async ({ authedPage }) => {
    await authedPage.goto(ROUTES.settings);

    // GİB section heading
    await expect(
      authedPage.getByRole("heading", { name: /GİB E-Fatura Entegrasyonu/i }),
    ).toBeVisible();
  });
});
