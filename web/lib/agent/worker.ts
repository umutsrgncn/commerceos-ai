import path from "node:path";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { getActivePreview, startPreview, stopPreview } from "./preview";
import { runTask } from "./runner";
import { destroyWorktree, mergeBranchToMain, type Worktree } from "./worktree";

const POLL_INTERVAL_MS = 3000;

const ACTIVE_STATUSES = ["PLANNING", "RUNNING", "TESTING"] as const;

let stopped = false;

export function stopWorker() {
  stopped = true;
}

/**
 * Loop: PENDING task'ları sırayla işle.
 * - Tek-aynı-anda: aktif (PLANNING/RUNNING/TESTING) varken yeni alma
 * - Atomik claim: updateMany(where status=PENDING) ile race önle
 * - PENDING iken cancelRequested gelirse worker buna düşmeden önce
 *   cancelAgentTaskAction zaten CANCELLED'a çekiyor (actions.ts'de)
 */
export async function runWorkerLoop() {
  // eslint-disable-next-line no-console
  console.log("[agent/worker] başlatıldı");
  while (!stopped) {
    try {
      // 1) Aktif preview varsa: review/approve/reject akışını yönet
      const handled = await handleActivePreview();
      if (handled) {
        await sleep(POLL_INTERVAL_MS);
        continue;
      }
      // 2) Sıradaki PENDING'i al
      const claimed = await claimNextTask();
      if (claimed) {
        // eslint-disable-next-line no-console
        console.log(`[agent/worker] task alındı: ${claimed.id} — ${claimed.title}`);
        await runTask(claimed.id);
        // eslint-disable-next-line no-console
        console.log(`[agent/worker] task tamam: ${claimed.id}`);
      } else {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[agent/worker] loop hata:", err);
      await sleep(POLL_INTERVAL_MS);
    }
  }
  // eslint-disable-next-line no-console
  console.log("[agent/worker] durdu");
}

async function handleActivePreview(): Promise<boolean> {
  // Önce in-memory preview, yoksa DB'de REVIEW'da bekleyen var mı? (worker restart sonrası)
  const active = getActivePreview();
  let taskId: string | null = active?.taskId ?? null;

  if (!taskId) {
    const review = await db.agentTask.findFirst({
      where: { status: "REVIEW", branchName: { not: null } },
      orderBy: { startedAt: "desc" },
      select: { id: true },
    });
    if (!review) return false;
    taskId = review.id;
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
    select: { status: true, branchName: true, title: true },
  });

  if (!task) {
    if (active) await stopPreview(taskId, "task silindi");
    return true;
  }

  // Hâlâ inceleme bekliyor
  if (task.status === "REVIEW") {
    // Worker restart sonrası in-memory preview yok ama task REVIEW — preview'ı yeniden başlat
    if (!active && task.branchName) {
      const worktreePath = `/tmp/agent-runs/${taskId}`;
      const webPath = path.join(worktreePath, "web");
      // worktree hâlâ disk'te mi?
      const fs = await import("node:fs/promises");
      const exists = await fs.stat(webPath).then(() => true).catch(() => false);
      if (!exists) {
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: "Worktree disk'te yok — task kurtarılamadı, FAILED'a çekiliyor.",
        });
        await db.agentTask.update({
          where: { id: taskId },
          data: {
            status: "FAILED",
            errorMsg:
              "Worker restart sonrası worktree disk'te yoktu — önizleme kurtarılamadı.",
            completedAt: new Date(),
            tunnelUrl: null,
            port: null,
          },
        });
        return true;
      }
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: "Worker restart edildi — önizleme yeniden başlatılıyor…",
      });
      try {
        const wt: Worktree = {
          taskId,
          branch: task.branchName,
          path: worktreePath,
          webPath,
        };
        const { port, tunnelUrl } = await startPreview({ taskId, wt });
        await db.agentTask.update({
          where: { id: taskId },
          data: { port, tunnelUrl: tunnelUrl ?? null },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: `Önizleme başlatılamadı: ${msg.slice(0, 200)}`,
        });
      }
    }
    return true;
  }

  // Onaylandı → main'e merge + cleanup
  if (task.status === "MERGED") {
    if (active) await stopPreview(taskId, "onaylandı, main'e merge ediliyor");
    if (task.branchName) {
      try {
        await mergeBranchToMain(task.branchName, `merge: ${task.title}`);
        await emitAgentEvent({
          taskId,
          type: "COMMIT",
          summary: `main'e merge edildi: ${task.branchName}`,
          payload: { branch: task.branchName },
        });
        await destroyWorktree(taskId, task.branchName);
        await emitAgentEvent({
          taskId,
          type: "NOTE",
          summary: "Worktree ve branch temizlendi.",
        });
        // Task completedAt + tunnelUrl temizle ki bir daha sahiplenilmesin
        await db.agentTask.update({
          where: { id: taskId },
          data: { tunnelUrl: null, port: null, completedAt: new Date() },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await emitAgentEvent({
          taskId,
          type: "ERROR",
          summary: `Merge hatası: ${msg.slice(0, 300)}`,
        });
        // Hata sonrası tekrar sahiplenmeyi engelle
        await db.agentTask.update({
          where: { id: taskId },
          data: { tunnelUrl: null, port: null, errorMsg: msg },
        });
      }
    }
    return true;
  }

  // Reddedildi veya iptal → cleanup, merge yok
  if (task.status === "REJECTED" || task.status === "CANCELLED") {
    const reason = task.status === "REJECTED" ? "reddedildi" : "iptal";
    if (active) await stopPreview(taskId, reason);
    if (task.branchName) {
      await destroyWorktree(taskId, task.branchName);
      await emitAgentEvent({
        taskId,
        type: "NOTE",
        summary: "Worktree ve branch temizlendi.",
      });
    }
    await db.agentTask.update({
      where: { id: taskId },
      data: { tunnelUrl: null, port: null, completedAt: new Date() },
    });
    return true;
  }

  return true;
}

async function claimNextTask(): Promise<{ id: string; title: string } | null> {
  // Aktif task var mı?
  const active = await db.agentTask.findFirst({
    where: { status: { in: [...ACTIVE_STATUSES] } },
    select: { id: true },
  });
  if (active) return null;

  // En eski PENDING'i bul
  const pending = await db.agentTask.findFirst({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true },
  });
  if (!pending) return null;

  // Atomic claim — başka worker araya girdiyse 0 satır döner
  const res = await db.agentTask.updateMany({
    where: { id: pending.id, status: "PENDING" },
    data: { status: "PLANNING", startedAt: new Date() },
  });
  if (res.count === 0) return null;
  return pending;
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
