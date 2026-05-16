import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

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

// .env.local'i yükle — pnpm test:e2e için DATABASE_URL/AUTH_SECRET gerekli.
// Test runner + child dev server her ikisi de bu env'i miras alır.
// (dotenv top-level'da yok, bağımlılık eklemeden manuel parse.)
try {
  const raw = readFileSync(path.resolve(__dirname, ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
} catch {
  // .env.local yoksa sessiz geç — CI ortamlarında env shell'den gelir
}

// Test schema güvencesi: production public'e dokunmamak için DATABASE_URL'i
// her zaman commerceos_test'e çevir. Helper db.ts assertTestSchema() bunu zorlar.
const baseDbUrl = process.env.DATABASE_URL;
if (baseDbUrl) {
  if (baseDbUrl.includes("schema=public")) {
    process.env.DATABASE_URL = baseDbUrl.replace("schema=public", "schema=commerceos_test");
  } else if (!baseDbUrl.includes("schema=commerceos_test")) {
    const sep = baseDbUrl.includes("?") ? "&" : "?";
    process.env.DATABASE_URL = `${baseDbUrl}${sep}schema=commerceos_test`;
  }
}

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
      // Dev server'ı test schema'sına bağla — globalSetup'ın yazdığı admin
      // ile auth route aynı schema'da çalışsın (stale hash riskini önle).
      DATABASE_URL: process.env.DATABASE_URL ?? "",
    },
    stdout: "ignore",
    stderr: "pipe",
    timeout: 120_000,
  },
});
