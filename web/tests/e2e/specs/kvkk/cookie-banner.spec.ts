/**
 * Çerez banner davranışı.
 *
 * - İlk girişte gösterilir
 * - "Sadece zorunlu" → localStorage'a yazılır, banner kaybolur
 * - Sonraki ziyarette gösterilmez
 */

import { test, expect } from "@playwright/test";

const STORAGE_KEY = "commerceos:cookie-consent-v1";

test.describe("KVKK Cookie Banner", () => {
  test("ilk girişte banner gösterilir", async ({ page }) => {
    await page.goto("/privacy");
    // Banner bir miktar geç renderlenebilir (useEffect)
    await expect(page.getByText(/Çerez kullanımı/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Tümünü kabul et/i }),
    ).toBeVisible();
  });

  test("'Sadece zorunlu' seçilince banner kaybolur ve localStorage'a yazar", async ({
    page,
  }) => {
    await page.goto("/privacy");
    await page.getByRole("button", { name: /Sadece zorunlu/i }).click();

    await expect(page.getByText(/Çerez kullanımı/i)).toBeHidden();

    const consent = await page.evaluate(
      (key) => localStorage.getItem(key),
      STORAGE_KEY,
    );
    expect(consent).not.toBeNull();
    const parsed = JSON.parse(consent ?? "{}");
    expect(parsed.level).toBe("essential");
    expect(typeof parsed.ts).toBe("number");
  });

  test("onay verildikten sonra reload'da banner görünmez", async ({ page }) => {
    await page.goto("/privacy");
    await page.getByRole("button", { name: /Tümünü kabul et/i }).click();
    await page.reload();
    await expect(page.getByText(/Çerez kullanımı/i)).toBeHidden();
  });
});
