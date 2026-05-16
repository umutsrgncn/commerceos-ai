/**
 * AI mock fixture — Playwright route intercept ile /api/ai/* +
 * ai-service çağrılarını deterministik mock yanıtlarla cevaplar.
 *
 * Mimari: shared `__aiOverrides` Map, hem authedPage'e hem default page'e
 * uygulanan route handler'ları aynı snapshot'ı okuyor. mockAi.override
 * çağrısı runtime'da reflect olur.
 *
 * E2E_REAL_AI=1 → mock devre dışı, gerçek AI'a düş.
 */

import { test as base, type Page } from "@playwright/test";
import { AI_MOCKS } from "../mocks/ai-responses";

const REAL_AI = process.env.E2E_REAL_AI === "1";

type Overrides = Partial<{ [K in keyof typeof AI_MOCKS]: unknown }>;

export type AiMockFixture = {
  __aiOverrides: Overrides;
  mockAi: {
    enabled: boolean;
    override: <K extends keyof typeof AI_MOCKS>(
      key: K,
      patch: Partial<(typeof AI_MOCKS)[K]>,
    ) => void;
  };
  installAiMocks: (page: Page) => Promise<void>;
};

export const test = base.extend<AiMockFixture>({
  __aiOverrides: async ({}, use) => {
    const overrides: Overrides = {};
    await use(overrides);
  },

  installAiMocks: async ({ __aiOverrides }, use) => {
    await use(async (page: Page) => {
      if (REAL_AI) return;
      await installRoutes(page, __aiOverrides);
    });
  },

  mockAi: async ({ page, __aiOverrides, installAiMocks }, use) => {
    const enabled = !REAL_AI;
    if (enabled) {
      await installRoutes(page, __aiOverrides);
    }
    await use({
      enabled,
      override<K extends keyof typeof AI_MOCKS>(
        key: K,
        patch: Partial<(typeof AI_MOCKS)[K]>,
      ) {
        const cur = (__aiOverrides[key] ?? AI_MOCKS[key]) as Record<
          string,
          unknown
        >;
        __aiOverrides[key] = { ...cur, ...patch } as never;
      },
    });
    void installAiMocks;
  },
});

async function installRoutes(page: Page, overrides: Overrides) {
  async function mockJson(
    pattern: string | RegExp,
    key: keyof typeof AI_MOCKS,
  ) {
    await page.route(pattern, async (route) => {
      const body = JSON.stringify(overrides[key] ?? AI_MOCKS[key]);
      await route.fulfill({ status: 200, contentType: "application/json", body });
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

  await mockJson("**/api/ai/cashflow-forecast", "cashflowForecast");
  await mockJson("**/api/ai/anomaly-scan", "anomalyScan");
  await mockText("**/api/ai/finance-insight", "financeInsightStream");

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
  // autopilot tetiklemesi `segment-by-id` endpoint'ini çağırıyor; ayni mock.
  await mockJson("**/customers/segment-by-id", "customerSegment");
  await mockJson("**/goals/suggest", "goalSuggest");
  await mockJson("**/products/dead-stock-campaign", "deadStockCampaign");
  await mockText("**/chat/agent/stream", "agentStream");
  await mockText("**/chat/stream", "chatStream");
  await mockText("**/finance/insight/stream", "financeInsightStream");
}

export { expect } from "@playwright/test";
