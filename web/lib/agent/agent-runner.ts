/**
 * Agent task runner.
 *
 * Bir AgentTask için sandbox'lı bir CLI yardımcı süreç başlatır, modelin
 * çıkardığı JSON event akışını AgentEvent kayıtlarına dönüştürür. Akış:
 *   1) Worktree oluştur (git worktree main'den dallandırır)
 *   2) CLI yardımcı süreci çalıştır (--dir <worktree>, JSON output)
 *   3) Olayları parse edip UI'a stream et
 *   4) Bitince commit + önizleme + REVIEW
 *
 * Worker bu fonksiyonu `runTaskWithAgent(taskId)` olarak çağırır.
 */
import { spawn, execFile as execFileCb } from "node:child_process";
import { promisify } from "node:util";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { startPreview } from "./preview";
import {
  commitWorktree,
  createWorktree,
  destroyWorktree,
  type Worktree,
} from "./worktree";

const execFile = promisify(execFileCb);

const AGENT_CLI_BIN = process.env.AGENT_CLI_BIN ?? "agent-cli";
// Pro = uzun dosya refactor + dedup + multi-file dependency takibi için daha
// güvenilir. Flash hızlı ama uzun task'larda koherent kalmıyor (test edildi:
// 363k token harcayıp 20 duplicate key bıraktı). Maliyeti yüksek ama
// hackathon demo'su kalite ister.
const AGENT_MODEL = process.env.AGENT_MODEL || "google/gemini-2.5-pro";
const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || 30 * 60_000);
/** TSC gate'i fail ederse agent CLI'a kaç defa düzelt çağrısı atılacak. */
const MAX_FIX_ATTEMPTS = Number(process.env.AGENT_MAX_FIX_ATTEMPTS || 3);

class CancelledError extends Error {
  constructor() {
    super("cancelled");
  }
}

async function isCancelled(taskId: string): Promise<boolean> {
  const row = await db.agentTask.findUnique({
    where: { id: taskId },
    select: { cancelRequested: true },
  });
  return !!row?.cancelRequested;
}

export async function runTaskWithAgent(taskId: string): Promise<void> {
  const task = await db.agentTask.findUnique({ where: { id: taskId } });
  if (!task) throw new Error(`Task bulunamadı: ${taskId}`);

  let wt: Worktree | null = null;

  try {
    const isIteration = !!task.branchName;
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: isIteration
        ? "İterasyon — mevcut çalışma alanı"
        : "Çalışma alanı hazırlanıyor",
    });

    wt = await createWorktree(taskId, task.title, {
      existingBranch: task.branchName ?? null,
    });

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        branchName: wt.branch,
        worktreePath: wt.path,
        status: "PLANNING",
        startedAt: task.startedAt ?? new Date(),
      },
    });

    await db.agentTask.update({
      where: { id: taskId },
      data: { status: "RUNNING" },
    });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Gemini ile kod yazımı başladı",
    });

    const result = await runAgentSubprocess(taskId, wt, task.prompt);

    if (await isCancelled(taskId)) throw new CancelledError();

    if (result.totalTokens > 0) {
      await db.agentTask.update({
        where: { id: taskId },
        data: { tokensUsed: { increment: result.totalTokens } },
      });
    }

    // ─── Build gate — TSC errors on changed files trigger fix loop ───
    let fixTokens = 0;
    for (let attempt = 1; attempt <= MAX_FIX_ATTEMPTS + 1; attempt++) {
      if (await isCancelled(taskId)) throw new CancelledError();
      const changed = await getChangedFiles(wt);
      if (changed.length === 0) break; // hiç değişiklik yok, build check'e gerek yok
      const tscErrors = await runTscOnChangedFiles(wt, changed);
      if (tscErrors.length === 0) {
        if (attempt > 1) {
          await emitAgentEvent({
            taskId,
            type: "STATUS",
            summary: `Hatalar düzeltildi (deneme ${attempt - 1}/${MAX_FIX_ATTEMPTS})`,
          });
        }
        break;
      }
      if (attempt > MAX_FIX_ATTEMPTS) {
        // Limit aşıldı — kullanıcıya sebebi göster, FAILED.
        const errSummary = tscErrors.slice(0, 6).join("\n");
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary:
            `TSC hataları düzeltilemedi (${MAX_FIX_ATTEMPTS} deneme tükendi):\n` +
            errSummary.slice(0, 700),
        });
        throw new Error(
          `Kod doğrulaması başarısız — ${tscErrors.length} TSC hatası, ${MAX_FIX_ATTEMPTS} düzeltme denemesinden sonra hâlâ var.`,
        );
      }
      await emitAgentEvent({
        taskId,
        type: "STATUS",
        summary: `Kod doğrulanıyor — ${tscErrors.length} hata bulundu, düzeltiliyor (deneme ${attempt}/${MAX_FIX_ATTEMPTS})`,
      });
      const fixPrompt = buildFixPrompt(tscErrors, changed);
      const fixResult = await runAgentSubprocess(taskId, wt, fixPrompt);
      fixTokens += fixResult.totalTokens;
    }
    if (fixTokens > 0) {
      await db.agentTask.update({
        where: { id: taskId },
        data: { tokensUsed: { increment: fixTokens } },
      });
    }

    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Değişiklikler commit'leniyor",
    });
    const commitMsg = `agent: ${task.title}`.slice(0, 200);
    const commitResult = await commitWorktree(wt, commitMsg, {
      name: "CommerceOS-Agent-Project-Feature",
      email: "agent@commerceos.cloud",
    });
    if (commitResult.ok) {
      await emitAgentEvent({
        taskId,
        type: "COMMIT",
        summary: `${commitResult.filesChanged} dosya commit'lendi · ${commitResult.sha.slice(0, 7)}`,
        payload: { sha: commitResult.sha, filesChanged: commitResult.filesChanged },
      });
    } else {
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: `Commit atlandı: ${commitResult.reason}`,
      });
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: { status: "TESTING" },
    });
    await emitAgentEvent({
      taskId,
      type: "STATUS",
      summary: "Önizleme hazırlanıyor",
    });
    const { port, tunnelUrl } = await startPreview({ taskId, wt });
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: "REVIEW",
        port,
        tunnelUrl: tunnelUrl ?? null,
      },
    });
    await emitAgentEvent({
      taskId,
      type: "TUNNEL",
      summary: `Önizleme hazır: ${tunnelUrl ?? `http://localhost:${port}`}`,
      payload: { url: tunnelUrl, port },
    });
  } catch (err) {
    const isCancel = err instanceof CancelledError;
    const msg = isCancel ? "Kullanıcı iptal etti" : err instanceof Error ? err.message : String(err);
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: isCancel ? "CANCELLED" : "FAILED",
        errorMsg: msg.slice(0, 1000),
        completedAt: new Date(),
        tunnelUrl: null,
        port: null,
      },
    });
    await emitAgentEvent({
      taskId,
      type: "ERROR",
      summary: msg.slice(0, 500),
    });
    if (wt && isCancel) {
      try {
        await destroyWorktree(taskId, wt.branch);
      } catch {}
    }
  }
}

type RunResult = { totalTokens: number; cost: number };

function runAgentSubprocess(
  taskId: string,
  wt: Worktree,
  prompt: string,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const args = [
      "run",
      "--dir",
      wt.path,
      "--format",
      "json",
      "--model",
      AGENT_MODEL,
      prompt,
    ];
    const child = spawn(AGENT_CLI_BIN, args, {
      cwd: wt.path,
      env: {
        ...process.env,
        GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
        NO_COLOR: "1",
        FORCE_COLOR: "0",
        TERM: "dumb",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let killed = false;
    const cancelPoll = setInterval(async () => {
      try {
        if (await isCancelled(taskId)) {
          killed = true;
          child.kill("SIGTERM");
          setTimeout(() => child.killed || child.kill("SIGKILL"), 5000);
          clearInterval(cancelPoll);
        }
      } catch {}
    }, 2000);

    const timeout = setTimeout(() => {
      if (!child.killed) {
        killed = true;
        child.kill("SIGTERM");
        setTimeout(() => child.killed || child.kill("SIGKILL"), 5000);
      }
    }, AGENT_TIMEOUT_MS);

    let stdoutBuf = "";
    let stderrBuf = "";
    let totalTokens = 0;
    let totalCost = 0;
    let stepCount = 0;

    child.stdout.on("data", (chunk: Buffer) => {
      stdoutBuf += chunk.toString();
      const lines = stdoutBuf.split("\n");
      stdoutBuf = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        try {
          const evt = JSON.parse(line);
          handleEvent(taskId, wt, evt, (tok, cost) => {
            totalTokens += tok;
            totalCost += cost;
            stepCount++;
          }).catch(() => {});
        } catch {
          emitAgentEvent({
            taskId,
            type: "NOTE",
            summary: line.slice(0, 300),
          }).catch(() => {});
        }
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderrBuf += chunk.toString();
      const lines = stderrBuf.split("\n");
      stderrBuf = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        if (/error|fail|exception|panic/i.test(line)) {
          emitAgentEvent({
            taskId,
            type: "ERROR",
            summary: line.slice(0, 300),
          }).catch(() => {});
        }
      }
    });

    child.on("close", (code) => {
      clearInterval(cancelPoll);
      clearTimeout(timeout);
      if (killed) {
        reject(new CancelledError());
        return;
      }
      if (code === 0) {
        emitAgentEvent({
          taskId,
          type: "STATUS",
          summary: `Kod yazımı tamamlandı · ${stepCount} adım · ${totalTokens.toLocaleString("tr-TR")} token`,
        }).catch(() => {});
        resolve({ totalTokens, cost: totalCost });
      } else {
        reject(new Error(`Agent süreci hata ile sonlandı (kod ${code})`));
      }
    });

    child.on("error", (err) => {
      clearInterval(cancelPoll);
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function handleEvent(
  taskId: string,
  wt: Worktree,
  evt: { type?: string; part?: Record<string, unknown> },
  onStep: (tokens: number, cost: number) => void,
) {
  if (!evt || typeof evt !== "object") return;
  const part = (evt.part ?? {}) as Record<string, unknown>;
  const type = evt.type;

  switch (type) {
    case "step_start":
      return;

    case "tool_use": {
      const tool = String(part.tool ?? "tool");
      const state = part.state as { input?: Record<string, unknown>; output?: string } | undefined;
      const input = state?.input ?? {};

      if (tool === "write" || tool === "edit") {
        const filePath = String((input as Record<string, unknown>).filePath ?? "?");
        const relPath = filePath.startsWith(wt.path)
          ? filePath.slice(wt.path.length + 1)
          : filePath;
        await emitAgentEvent({
          taskId,
          type: "FILE_WRITE",
          summary: relPath,
          payload: { file: relPath, absolute: filePath },
        });
        return;
      }

      if (tool === "bash") {
        const cmd = String((input as Record<string, unknown>).command ?? "").slice(0, 200);
        await emitAgentEvent({
          taskId,
          type: "TOOL_CALL",
          summary: `bash: ${cmd}`,
          payload: { tool: "bash", command: cmd },
        });
        return;
      }

      await emitAgentEvent({
        taskId,
        type: "TOOL_CALL",
        summary: `${tool}${Object.keys(input).length ? ` · ${JSON.stringify(input).slice(0, 150)}` : ""}`,
        payload: { tool, input: input as Record<string, unknown> },
      });
      return;
    }

    case "step_finish": {
      const tokens = part.tokens as { total?: number } | undefined;
      const cost = typeof part.cost === "number" ? (part.cost as number) : 0;
      const tot = tokens?.total ?? 0;
      onStep(tot, cost);
      return;
    }

    case "text":
    case "text_delta":
    case "thinking": {
      const text = String((part as { text?: unknown }).text ?? "").trim();
      if (text) {
        await emitAgentEvent({
          taskId,
          type: "THINK",
          summary: text.slice(0, 400),
        });
      }
      return;
    }

    case "error":
    case "step_error": {
      const msg = String((part as { message?: unknown }).message ?? JSON.stringify(part).slice(0, 200));
      await emitAgentEvent({
        taskId,
        type: "ERROR",
        summary: msg.slice(0, 400),
      });
      return;
    }

    default:
      return;
  }
}

// ─── Build gate helpers ────────────────────────────────────────────────────

/**
 * Worktree'de agent'ın değiştirdiği dosyaları döndür (commit öncesi).
 * Kapsam: `web/` altındaki ts/tsx/js/jsx dosyaları — TSC bunları check eder.
 */
async function getChangedFiles(wt: Worktree): Promise<string[]> {
  try {
    const { stdout } = await execFile(
      "git",
      ["status", "--porcelain", "--", "web/"],
      { cwd: wt.path, maxBuffer: 1024 * 1024 * 4 },
    );
    return stdout
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[ AMDRCU?!]{1,2}\s+/, ""))
      .filter((f) => /\.(tsx?|jsx?)$/.test(f));
  } catch {
    return [];
  }
}

/**
 * Worktree'nin web/ dizininde `tsc --noEmit` çalıştır, sadece değişen
 * dosyalara ait hataları döndür. Repo'da pre-existing TSC hataları var
 * (next.config.ts `ignoreBuildErrors: true`) — onları gürültü sayma.
 */
async function runTscOnChangedFiles(
  wt: Worktree,
  changedFiles: string[],
): Promise<string[]> {
  // Path'ler `web/` ile başlıyor; tsc cwd'si `web/` olduğu için prefix at.
  const rel = new Set(
    changedFiles
      .filter((f) => f.startsWith("web/"))
      .map((f) => f.slice("web/".length)),
  );
  if (rel.size === 0) return [];

  let stdout = "";
  try {
    const res = await execFile(
      "pnpm",
      ["exec", "tsc", "--noEmit", "--project", "tsconfig.json"],
      {
        cwd: `${wt.path}/web`,
        maxBuffer: 1024 * 1024 * 16,
      },
    );
    stdout = res.stdout;
  } catch (err) {
    // tsc non-zero exit'le döner — output yine stdout'ta
    const e = err as { stdout?: string };
    stdout = e.stdout ?? "";
  }
  return stdout
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /\.tsx?\(\d+,\d+\): error/i.test(l))
    .filter((l) => {
      const m = l.match(/^([^(]+)\(/);
      if (!m) return false;
      return rel.has(m[1]);
    });
}

/**
 * Agent'a "şu hataları düzelt" diye iletmek için yapılandırılmış prompt.
 * AGENTS.md'deki ipucuları zaten yüklü — burada sadece somut hata listesi.
 */
function buildFixPrompt(tscErrors: string[], changedFiles: string[]): string {
  const errBlock = tscErrors.slice(0, 30).join("\n");
  const fileList = changedFiles.slice(0, 10).join(", ");
  return [
    "Önceki düzenleme TypeScript hatalarıyla bitti. Aşağıdaki hataları DÜZELT:",
    "",
    errBlock,
    "",
    `Etkilenen dosyalar: ${fileList}`,
    "",
    "Kurallar:",
    "- AGENTS.md'deki Next.js App Router server/client pattern'ine uy.",
    "- `page.tsx`'lerin async + metadata export'u varsa onlara `\"use client\"` EKLEME — interaktif kısım için ayrı bir client component dosyası kullan.",
    "- Yeni eklenmiş kullanılmayan import varsa kaldır.",
    "- Aynı dosyaya defalarca yazma; ÖNCE oku, sonra TEK düzgün yazma yap.",
    "- TSC temizleninceye kadar düzelt.",
  ].join("\n");
}
