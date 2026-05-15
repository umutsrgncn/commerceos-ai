import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { db } from "@/lib/db";
import { getTestDatabaseUrl } from "./test-db";

const exec = promisify(execFile);

const E2E_TIMEOUT_MS = 180_000; // 3 dakika tüm specs
const RESULTS_DIR = ".agent-logs/e2e";
const REPO_ROOT = process.env.AGENT_REPO_ROOT ?? "/opt/commerceos";
const PUBLIC_SCREENSHOT_ROOT = path.join(REPO_ROOT, "web/public/agent-screenshots");

export type E2eRunResult = {
  ok: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  durationMs: number;
  output: string; // tail
  /** Worktree içindeki screenshot path'leri (relatif) */
  screenshots: string[];
};

/**
 * Worktree'de seçilen Playwright spec'lerini çalıştırır.
 * Worktree dev server'ı zaten port'unda dinliyor olmalı.
 */
export async function runE2eGate(opts: {
  taskId: string;
  worktreePath: string;
  webPath: string;
  port: number;
  specs: string[];
}): Promise<E2eRunResult> {
  if (opts.specs.length === 0) {
    return {
      ok: true,
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0,
      output: "(no specs)",
      screenshots: [],
    };
  }

  // Worktree'de output dizini
  const outDir = path.join(opts.worktreePath, RESULTS_DIR);
  await fs.mkdir(outDir, { recursive: true });
  const reporterFile = path.join(outDir, "results.json");

  const t0 = Date.now();
  let exitOk = false;
  let stdoutText = "";
  let stderrText = "";

  // Test schema URL'i — Playwright globalSetup canlı public'e değil
  // commerceos_test'e yazsın. Ayrıca DATABASE_URL'i explicit geçiriyoruz çünkü
  // tsx --env-file ile yüklenen env child spawn'a güvenilir geçmeyebiliyor.
  let testDbUrl: string | null = null;
  try {
    testDbUrl = getTestDatabaseUrl();
  } catch {
    testDbUrl = null;
  }

  try {
    const { stdout, stderr } = await exec(
      "pnpm",
      [
        "exec",
        "playwright",
        "test",
        ...opts.specs,
        "--reporter=json",
        `--output=${outDir}/artifacts`,
      ],
      {
        cwd: opts.webPath,
        env: {
          ...process.env,
          ...(testDbUrl ? { DATABASE_URL: testDbUrl } : {}),
          E2E_PORT: String(opts.port),
          E2E_BASEURL: `http://localhost:${opts.port}`,
          E2E_REAL_AI: "0",
          CI: "1",
        },
        maxBuffer: 1024 * 1024 * 8,
        timeout: E2E_TIMEOUT_MS,
      },
    );
    stdoutText = stdout;
    stderrText = stderr;
    exitOk = true;
  } catch (err) {
    if (err && typeof err === "object") {
      stdoutText = String((err as { stdout?: string }).stdout ?? "");
      stderrText = String((err as { stderr?: string }).stderr ?? "");
    }
    exitOk = false;
  }

  const durationMs = Date.now() - t0;

  // JSON reporter çıktısını parse et
  let total = 0;
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const screenshots: string[] = [];
  const testRows: Array<{ name: string; status: "PASSED" | "FAILED" | "SKIPPED"; durationMs: number; output?: string }> = [];

  let parseOk = false;
  try {
    const raw = stdoutText.trim();
    const jsonStart = raw.indexOf("{");
    if (jsonStart >= 0) {
      const parsed = JSON.parse(raw.slice(jsonStart));
      walkSuites(parsed.suites ?? [], (test, status, dur, msg) => {
        total += 1;
        if (status === "PASSED") passed += 1;
        else if (status === "FAILED") failed += 1;
        else skipped += 1;
        testRows.push({ name: test, status, durationMs: dur, output: msg });
      });
      parseOk = true;
    }
  } catch {
    // parse error — fallback aşağıda
  }

  // Exec fail + parse fail → playwright komutu başlamadan öldü
  // (chromium binary yok, syntax hatası vb). total=0 olarak "tanımlanmamış" göstermek
  // YANILTICI; failed=1 ile gerçek hatayı raporla.
  if (!exitOk && !parseOk) {
    total = 1;
    failed = 1;
    const errSnippet = (stderrText + "\n" + stdoutText).trim().slice(0, 1500);
    testRows.push({
      name: "playwright bootstrap",
      status: "FAILED",
      durationMs,
      output: errSnippet || "playwright komutu başarısız (stdout/stderr boş).",
    });
  }

  // Static spec screenshot'larını TOPLAMA — kullanıcıyı boğuyor (admin-routes
  // 31 URL test ediyor, her biri için failed-on-screenshot ürettiğinde dashboard
  // 40+ alakasız thumbnail göstermek zorunda kalıyor.
  // Asıl değişen sayfanın screenshot'ını dynamic-e2e zaten alıyor.
  // Static spec'in görevi: build error / runtime crash yakalamak (sadece pass/fail).

  // DB'ye AgentTestRun + AgentScreenshot kaydet
  for (const t of testRows) {
    try {
      await db.agentTestRun.create({
        data: {
          taskId: opts.taskId,
          name: t.name.slice(0, 200),
          status: t.status,
          durationMs: t.durationMs,
          output: t.output ? t.output.slice(0, 5000) : null,
        },
      });
    } catch {}
  }

  // Screenshot'ları public/agent-screenshots/<taskId>/ altına kopyala → web'den serve edilebilsin
  const publicDir = path.join(PUBLIC_SCREENSHOT_ROOT, opts.taskId);
  try {
    await fs.mkdir(publicDir, { recursive: true });
  } catch {}

  for (const rel of screenshots) {
    const baseName = path.basename(rel);
    const dest = path.join(publicDir, `scope-${baseName}`);
    const publicUrl = `/agent-screenshots/${opts.taskId}/scope-${baseName}`;
    try {
      await fs.copyFile(rel, dest);
      await db.agentScreenshot.create({
        data: {
          taskId: opts.taskId,
          label: path.basename(rel, ".png"),
          path: publicUrl,
        },
      });
    } catch {
      // kopyalama başarısız → kaydı atla
    }
  }

  const output = (stdoutText + "\n" + stderrText).slice(-5000);

  return {
    ok: exitOk && failed === 0,
    total,
    passed,
    failed,
    skipped,
    durationMs,
    output,
    screenshots,
  };
}

function walkSuites(
  suites: unknown[],
  cb: (testName: string, status: "PASSED" | "FAILED" | "SKIPPED", durationMs: number, output?: string) => void,
) {
  for (const suite of suites) {
    if (!suite || typeof suite !== "object") continue;
    const s = suite as { specs?: unknown[]; suites?: unknown[]; title?: string };
    if (Array.isArray(s.specs)) {
      for (const spec of s.specs) {
        const sp = spec as { title?: string; tests?: unknown[] };
        for (const t of sp.tests ?? []) {
          const tt = t as { status?: string; results?: Array<{ status?: string; duration?: number; error?: { message?: string } }> };
          const results = tt.results ?? [];
          const last = results[results.length - 1];
          const status = (last?.status ?? "skipped").toUpperCase() as
            | "PASSED"
            | "FAILED"
            | "SKIPPED";
          const norm =
            status === "PASSED" || status === "FAILED" || status === "SKIPPED"
              ? status
              : ((status as string).startsWith("FAIL") ? "FAILED" : status === "OK" ? "PASSED" : "SKIPPED");
          const dur = Math.round(last?.duration ?? 0);
          const msg = last?.error?.message;
          cb(`${s.title ?? ""} › ${sp.title ?? ""}`.trim(), norm as "PASSED" | "FAILED" | "SKIPPED", dur, msg);
        }
      }
    }
    if (Array.isArray(s.suites)) walkSuites(s.suites, cb);
  }
}

async function collectScreenshots(outDir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) await walk(full);
      else if (/\.(png|jpe?g)$/i.test(e.name)) out.push(full);
    }
  }
  try {
    await walk(outDir);
  } catch {}
  return out;
}

/** UI'a Türkçe özet */
export function summarizeE2eResult(r: E2eRunResult): string {
  if (r.total === 0) return "İlgili scope için e2e testi tanımlanmamış.";
  return `${r.passed}/${r.total} test geçti${r.failed > 0 ? `, ${r.failed} başarısız` : ""}${r.skipped > 0 ? `, ${r.skipped} atlandı` : ""} · ${(r.durationMs / 1000).toFixed(1)}sn · ${r.screenshots.length} ekran görüntüsü`;
}
