import { defineConfig, devices } from "@playwright/test";

/**
 * E2E test configuration.
 *
 * Klasör yapısı:
 *   tests/e2e/
 *     fixtures/   — auth, db, autopilot guard, ai mock fixture
 *     helpers/    — selectors, routes, programmatic API
 *     mocks/      — AI service mock yanıtları
 *     specs/      — feature başına klasör
 *
 * Çalıştırma:
 *   pnpm test:e2e                        — hepsi
 *   pnpm test:e2e specs/auth             — bir klasör
 *   pnpm test:e2e -g "login"             — pattern
 *   E2E_REAL_AI=1 pnpm test:e2e          — AI mock'u kapat (yavaş, quota yer)
 *   E2E_HEADED=1 pnpm test:e2e --debug   — tarayıcılı debug
 */

const PORT = Number(process.env.E2E_PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;
const headed = process.env.E2E_HEADED === "1";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/specs/**/*.spec.ts", "**/*.spec.ts"],

  /** globalSetup garantisi: otopilot kapalı olarak başlasın. */
  globalSetup: "./tests/e2e/global-setup.ts",
  globalTeardown: "./tests/e2e/global-teardown.ts",

  /** Otopilot UI'ından emin olmak için sıralı çalış (paralel test
   *  otopilot toggle'ını yarıştırabilir). */
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: !headed,
    /** Server actions ile yapılan işlemler için biraz daha tolerant. */
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    // Agent runner'ında dev server worktree'de zaten ayrı süreçte başlatılıyor —
    // Playwright kendi başlatmaya kalkmasın, port çakışmasında ölmesin. Local
    // dev'de de zaten dev server açık olur, reuse zararsız.
    reuseExistingServer: true,
    // NEXTAUTH_URL/AUTH_URL — testte LOCALHOST olmalı; production env'i
    // (commerceos.cloud) miras alınırsa login submit canlıya redirect olur.
    env: {
      NEXTAUTH_URL: baseURL,
      AUTH_URL: baseURL,
      AUTH_TRUST_HOST: "true",
    },
    stdout: "ignore",
    stderr: "pipe",
    timeout: 120_000,
  },
});
