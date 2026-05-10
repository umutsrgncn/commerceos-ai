/**
 * Auth gate — yetkisiz erişimde /login'e yönlendirme.
 */

import { expect, test } from "@playwright/test";
import { ROUTES } from "../../helpers/routes";

test.describe("admin auth gate", () => {
  const PROTECTED = [
    ROUTES.dashboard,
    ROUTES.products,
    ROUTES.aiChat,
    ROUTES.autopilot,
    ROUTES.bank,
    ROUTES.invoices,
    ROUTES.suppliers,
    ROUTES.settings,
  ];

  for (const path of PROTECTED) {
    test(`yetkisiz ziyaret ${path} → /login`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    });
  }
});
