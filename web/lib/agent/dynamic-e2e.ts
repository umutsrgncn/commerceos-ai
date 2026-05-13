import { chromium, type Browser } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import type { ChangedPage } from "./changed-pages";

/**
 * Public dir — Next ana app /agent-screenshots/<taskId>/<n>.png olarak serve eder.
 * Mutlak path:  web/public/agent-screenshots/<taskId>/<n>.png
 * URL:          /agent-screenshots/<taskId>/<n>.png
 */
const REPO_ROOT = process.env.AGENT_REPO_ROOT ?? "/opt/commerceos";
const PUBLIC_ROOT = path.join(REPO_ROOT, "web/public/agent-screenshots");

export type DynamicE2eResult = {
  total: number;
  passed: number;
  failed: number;
  pages: Array<{ url: string; status: number; screenshotUrl?: string }>;
};

/**
 * Agent'ın değiştirdiği/oluşturduğu her sayfaya gidip:
 *   1. HTTP status kontrolü (< 500)
 *   2. Tam sayfa ekran görüntüsü
 * Sonuçları AgentTestRun + AgentScreenshot tablolarına yazar.
 */
export async function runDynamicE2e(opts: {
  taskId: string;
  port: number;
  pages: ChangedPage[];
}): Promise<DynamicE2eResult> {
  if (opts.pages.length === 0) {
    return { total: 0, passed: 0, failed: 0, pages: [] };
  }

  const taskScreenshotDir = path.join(PUBLIC_ROOT, opts.taskId);
  await fs.mkdir(taskScreenshotDir, { recursive: true });

  let browser: Browser | null = null;
  const results: DynamicE2eResult["pages"] = [];
  let passed = 0;
  let failed = 0;

  try {
    browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      // Cookie kabul etmesi için bayrak
      ignoreHTTPSErrors: true,
    });

    for (const cp of opts.pages) {
      const fullUrl = `http://localhost:${opts.port}${cp.url}`;
      const page = await ctx.newPage();
      const t0 = Date.now();
      let status = 0;
      let errorMsg: string | null = null;

      try {
        const resp = await page.goto(fullUrl, {
          waitUntil: "networkidle",
          timeout: 30_000,
        });
        status = resp?.status() ?? 0;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
      }

      const passedThis = !errorMsg && status > 0 && status < 500;
      if (passedThis) passed += 1;
      else failed += 1;

      // Screenshot — başarısız olsa bile al, görsel kanıt için
      const safeName = (cp.url.replace(/[\/\\]/g, "_") || "_root").replace(/[^a-zA-Z0-9_-]/g, "");
      const fileName = `${safeName || "page"}.png`;
      const absPath = path.join(taskScreenshotDir, fileName);
      const publicUrl = `/agent-screenshots/${opts.taskId}/${fileName}`;

      try {
        await page.screenshot({ path: absPath, fullPage: false });
      } catch {
        // sayfa hiç yüklenmediyse screenshot olamayabilir
      }
      await page.close();

      const durationMs = Date.now() - t0;
      results.push({ url: cp.url, status, screenshotUrl: publicUrl });

      // DB kayıt
      await db.agentTestRun.create({
        data: {
          taskId: opts.taskId,
          name: `Değişen sayfa: ${cp.url}`,
          status: passedThis ? "PASSED" : "FAILED",
          durationMs,
          output: errorMsg
            ? `Hata: ${errorMsg.slice(0, 2000)}`
            : `HTTP ${status}`,
        },
      });

      try {
        await fs.stat(absPath);
        await db.agentScreenshot.create({
          data: {
            taskId: opts.taskId,
            label: `${cp.url}  (HTTP ${status || "—"})`,
            path: publicUrl,
            width: 1280,
            height: 800,
          },
        });
      } catch {
        // dosya yok — screenshot başarısız
      }
    }

    await ctx.close();
  } catch (err) {
    await emitAgentEvent({
      taskId: opts.taskId,
      type: "ERROR",
      summary: `Dinamik e2e Playwright hatası: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}`,
    });
  } finally {
    if (browser) await browser.close();
  }

  return { total: opts.pages.length, passed, failed, pages: results };
}
