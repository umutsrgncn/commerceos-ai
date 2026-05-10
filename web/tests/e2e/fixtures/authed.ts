/**
 * Authenticated browser context fixture.
 *
 * Kullanım:
 *   import { test, expect } from "../../fixtures";
 *   test("...", async ({ authedPage }) => {
 *     await authedPage.goto("/admin");
 *   });
 *
 * `authedPage` kendi yeni context'i ile gelir + AI mock'ları otomatik
 * yüklenir (E2E_REAL_AI=0 ise).
 *
 * Auth UI test eden spec bu fixture'ı KULLANMAZ — orada vanilla
 * @playwright/test'i kullan, login UI'ından geç.
 */

import { test as base, type Page } from "@playwright/test";
import { test as aiMockBase } from "./ai-mock";
import { loginAsAdmin } from "./auth";

export type AuthedFixture = {
  authedPage: Page;
};

export const test = aiMockBase.extend<AuthedFixture>({
  authedPage: async ({ browser, installAiMocks }, use) => {
    const ctx = await browser.newContext();
    await loginAsAdmin(ctx);
    const page = await ctx.newPage();
    // AI mock route'larını authedPage'e yükle
    await installAiMocks(page);
    try {
      await use(page);
    } finally {
      await ctx.close();
    }
  },
});

export { expect } from "@playwright/test";
