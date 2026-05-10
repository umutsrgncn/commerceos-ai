/**
 * AI mock fixture — Playwright page.route ile /api/ai/* + ai-service
 * çağrılarını intercept eder ve deterministik mock yanıtlar döner.
 *
 * E2E_REAL_AI=1 set edilmişse mock devre dışı — gerçek AI'a düşer.
 *
 * Kullanım:
 *   const { test, expect } = await import("../../fixtures");
 *   test("foo", async ({ authedPage, mockAi }) => {
 *     await mockAi.enable();
 *     // veya: await mockAi.override("expenseCategorize", { confidence: 50 });
 *   });
 *
 * Default: aktif. Disable için `mockAi.disable()`.
 */

import { test as base, type Page } from "@playwright/test";
import { AI_MOCKS } from "../mocks/ai-responses";

const REAL_AI = process.env.E2E_REAL_AI === "1";

export type AiMockFixture = {
  mockAi: {
    enabled: boolean;
    disable: () => Promise<void>;
    override: <K extends keyof typeof AI_MOCKS>(
      key: K,
      patch: Partial<(typeof AI_MOCKS)[K]>,
    ) => void;
  };
};

type Overrides = Partial<{ [K in keyof typeof AI_MOCKS]: unknown }>;

/** Tek bir page'e mock route'larını yükle. */
async function installRoutes(page: Page, overrides: Overrides) {
  // Helper: bir url pattern + mock key birleştir
  async function mockJson(
    pattern: string | RegExp,
    key: keyof typeof AI_MOCKS,
  ) {
    await page.route(pattern, async (route) => {
      const body = JSON.stringify(overrides[key] ?? AI_MOCKS[key]);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body,
      });
    });
  }

  async function mockText(
    pattern: string | RegExp,
    key: keyof typeof AI_MOCKS,
    contentType = "text/plain; charset=utf-8",
  ) {
    await page.route(pattern, async (route) => {
      const body = String(overrides[key] ?? AI_MOCKS[key]);
      await route.fulfill({ status: 200, contentType, body });
    });
  }

  // ─── Next.js /api/ai/* proxy'leri ─────────────────────────────────────────
  await mockJson("**/api/ai/cashflow-forecast", "cashflowForecast");
  await mockJson("**/api/ai/anomaly-scan", "anomalyScan");
  await mockText("**/api/ai/finance-insight", "financeInsightStream");

  // ─── Doğrudan AI service URL'lerine atılan istekler ────────────────────
  // (Server action'lar AI_BASE üzerinden çağrı yapar — bu test browser'dan
  // görülmez ama Next.js içinde proxy'lendiyse görünür. Aşağıdaki pattern'ler
  // ai-service direkt çağrıları için.)
  await mockJson("**/finance/expense/categorize", "expenseCategorize");
  await mockJson("**/finance/discount/suggest", "discountSuggest");
  await mockJson("**/finance/cashflow/forecast", "cashflowForecast");
  await mockJson("**/finance/anomaly/scan", "anomalyScan");
  await mockJson("**/pricing/suggest", "pricingSuggest");
  await mockJson("**/receipt/ocr", "receiptOcr");
  await mockJson("**/reviews/reply", "reviewsReply");
  await mockJson("**/reviews/analyze", "reviewsAnalyze");
  await mockJson("**/bank/match", "bankMatch");
  await mockJson("**/messages/draft", "messagesDraft");
  await mockJson("**/messages/supplier-reorder", "supplierReorder");
  await mockJson("**/products/describe", "productDescribe");
  await mockJson("**/customers/segment", "customerSegment");
  await mockJson("**/goals/suggest", "goalSuggest");
  await mockText("**/chat/agent/stream", "agentStream");
  await mockText("**/chat/stream", "chatStream");
  await mockText("**/finance/insight/stream", "financeInsightStream");
}

export const test = base.extend<AiMockFixture>({
  mockAi: async ({ page }, use) => {
    const overrides: Overrides = {};
    let enabled = !REAL_AI;

    if (enabled) {
      await installRoutes(page, overrides);
    }

    await use({
      enabled,
      async disable() {
        await page.unroute("**/api/ai/**");
        await page.unroute("**/finance/**");
        await page.unroute("**/pricing/**");
        await page.unroute("**/receipt/**");
        await page.unroute("**/reviews/**");
        await page.unroute("**/bank/match");
        await page.unroute("**/messages/**");
        await page.unroute("**/products/describe");
        await page.unroute("**/customers/segment");
        await page.unroute("**/goals/suggest");
        await page.unroute("**/chat/**");
        enabled = false;
      },
      override<K extends keyof typeof AI_MOCKS>(
        key: K,
        patch: Partial<(typeof AI_MOCKS)[K]>,
      ) {
        const cur = (overrides[key] ?? AI_MOCKS[key]) as Record<string, unknown>;
        overrides[key] = {
          ...cur,
          ...patch,
        } as never;
      },
    });
  },
});

export { expect } from "@playwright/test";
