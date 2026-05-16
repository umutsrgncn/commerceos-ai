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
import { spawn } from "node:child_process";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { startPreview } from "./preview";
import {
  commitWorktree,
  createWorktree,
  destroyWorktree,
  type Worktree,
} from "./worktree";

const AGENT_CLI_BIN = process.env.AGENT_CLI_BIN || "/root/.opencode/bin/opencode";
const AGENT_MODEL = process.env.AGENT_MODEL || "google/gemini-2.5-flash";
const AGENT_TIMEOUT_MS = Number(process.env.AGENT_TIMEOUT_MS || 30 * 60_000);

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
