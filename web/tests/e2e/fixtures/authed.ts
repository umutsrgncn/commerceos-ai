/**
 * Authenticated browser context fixture.
 *
 * Spec içinde:
 *   import { test, expect } from "../../fixtures";
 *   test("...", async ({ authedPage }) => {
 *     await authedPage.goto("/admin");
 *   });
 *
 * Auth UI test eden spec bu fixture'ı KULLANMAZ — orada vanilla
 * @playwright/test'i kullan, login UI'ından geç.
 */

import { test as base, type Page } from "@playwright/test";
import { loginAsAdmin } from "./auth";

export type AuthedFixture = {
  authedPage: Page;
};

export const test = base.extend<AuthedFixture>({
  authedPage: async ({ browser }, use) => {
    const ctx = await browser.newContext();
    await loginAsAdmin(ctx);
    const page = await ctx.newPage();
    try {
      await use(page);
    } finally {
      await ctx.close();
    }
  },
});

export { expect } from "@playwright/test";
