/**
 * AI mock fixture — Playwright route intercept ile /api/ai/* + ai-service
 * çağrılarını deterministik mock yanıtlarla cevaplar.
 *
 * E2E_REAL_AI=1 ile mock devre dışı.
 *
 * Kullanım:
 *   import { test } from "../../fixtures";
 *   test("...", async ({ authedPage, mockAi }) => {
 *     mockAi.override("pricingSuggest", { confidence: 50 });
 *   });
 */

import { test as base, type Page } from "@playwright/test";
import { AI_MOCKS } from "../mocks/ai-responses";

const REAL_AI = process.env.E2E_REAL_AI === "1";

type Overrides = Partial<{ [K in keyof typeof AI_MOCKS]: unknown }>;

export type AiMockFixture = {
  mockAi: {
    enabled: boolean;
    /** Spesifik bir mock'u override et (test içinden çağrılır). */
    override: <K extends keyof typeof AI_MOCKS>(
      key: K,
      patch: Partial<(typeof AI_MOCKS)[K]>,
    ) => void;
  };
  /** Bir page'e AI mock route'larını yükle. authed fixture bunu otomatik
   *  her authedPage için çağırır — direkt kullanmana gerek yok. */
  installAiMocks: (page: Page) => Promise<void>;
};

export const test = base.extend<AiMockFixture>({
  installAiMocks: async ({}, use) => {
    await use(async (page: Page) => {
      if (REAL_AI) return;
      await installRoutes(page, {});
    });
  },

  mockAi: async ({ page, installAiMocks }, use) => {
    const overrides: Overrides = {};
    const enabled = !REAL_AI;

    if (enabled) {
      // Default page'e de yükle (auth UI testi gibi authedPage olmayan
      // durumlar için)
      await installRoutes(page, overrides);
    }

    await use({
      enabled,
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
    // installAiMocks fixture'ı authedPage'de zaten yükledi
    void installAiMocks;
  },
});

// ─── route installation ─────────────────────────────────────────────────────

async function installRoutes(page: Page, overrides: Overrides) {
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

  // /api/ai/* (Next.js proxy'leri — browser fetch)
  await mockJson("**/api/ai/cashflow-forecast", "cashflowForecast");
  await mockJson("**/api/ai/anomaly-scan", "anomalyScan");
  await mockText("**/api/ai/finance-insight", "financeInsightStream");

  // ai-service direkt (bazı test'ler programmatic POST atabilir)
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

export { expect } from "@playwright/test";
