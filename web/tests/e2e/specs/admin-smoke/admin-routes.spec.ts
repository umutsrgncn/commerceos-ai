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
  admin_products_new: "/admin/products/new",
  admin_orders_new: "/admin/orders/new",
  admin_profile: "/admin/profile",
  admin_reviews: "/admin/reviews",
  admin_suppliers: "/admin/suppliers",
  admin_suppliers_new: "/admin/suppliers/new",
  admin_inventory: "/admin/inventory",
  admin_orders: "/admin/orders",
  admin_customers: "/admin/customers",
  admin_customers_new: "/admin/customers/new",
  admin_customers_campaign: "/admin/customers/campaign",
  admin_categories: "/admin/categories",
  admin_discounts: "/admin/discounts",
  admin_discounts_new: "/admin/discounts/new",
  admin_finance: "/admin/finance",
  admin_finance_scheduled: "/admin/finance/scheduled",
  admin_analytics: "/admin/analytics",
  admin_autopilot: "/admin/autopilot",
  admin_ai: "/admin/ai",
  admin_agent: "/admin/agent",
  admin_activity: "/admin/activity",
  admin_settings: "/admin/settings",
  admin_settings_kvkk: "/admin/settings/kvkk",
  admin_data_requests: "/admin/data-requests",
  admin_bank: "/admin/bank",
  admin_bank_import: "/admin/bank/import",
  admin_expenses: "/admin/expenses",
  admin_expenses_new: "/admin/expenses/new",
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
