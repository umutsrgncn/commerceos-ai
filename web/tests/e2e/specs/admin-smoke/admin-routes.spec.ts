import { expect, test } from "@playwright/test";

/**
 * Login'siz admin route'larının 500 (build/runtime error) vermediğini test eder.
 * 307 (auth redirect), 200 (cached/public), 404 (yok) hepsi geçerli — sadece 500 hata.
 *
 * Bu spec agent task'larının build error verip vermediğini yakalar.
 */

const ADMIN_ROUTES: Record<string, string> = {
  admin_dashboard: "/admin",
  admin_products: "/admin/products",
  admin_inventory: "/admin/inventory",
  admin_orders: "/admin/orders",
  admin_customers: "/admin/customers",
  admin_categories: "/admin/categories",
  admin_discounts: "/admin/discounts",
  admin_finance: "/admin/finance",
  admin_analytics: "/admin/analytics",
  admin_autopilot: "/admin/autopilot",
  admin_ai: "/admin/ai",
  admin_agent: "/admin/agent",
  admin_activity: "/admin/activity",
  admin_settings: "/admin/settings",
  admin_data_requests: "/admin/data-requests",
  admin_bank: "/admin/bank",
  admin_expenses: "/admin/expenses",
  admin_invoices: "/admin/invoices",
};

test.describe("admin · route smoke", () => {
  for (const [scope, url] of Object.entries(ADMIN_ROUTES)) {
    test(`${scope} (${url}) build hatasız`, async ({ page }) => {
      const resp = await page.goto(url);
      const status = resp?.status() ?? 0;
      // 500+ = build/runtime error. Diğer her şey OK.
      expect(status, `${url} → ${status}`).toBeLessThan(500);
      const safeName = url.replace(/[\/\\]/g, "_");
      await page.screenshot({
        path: `${test.info().outputDir}/admin${safeName}.png`,
        fullPage: false,
      });
    });
  }
});
