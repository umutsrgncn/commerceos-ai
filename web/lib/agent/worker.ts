import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { getActivePreview, stopPreview } from "./preview";
import { runTask } from "./runner";
import { destroyWorktree, mergeBranchToMain } from "./worktree";

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
  const active = getActivePreview();
  if (!active) return false;

  const task = await db.agentTask.findUnique({
    where: { id: active.taskId },
    select: { status: true, branchName: true, title: true },
  });

  if (!task) {
    await stopPreview(active.taskId, "task silindi");
    return true;
  }

  // Hâlâ inceleme bekliyor — döngüye dön
  if (task.status === "REVIEW") return true;

  // Onaylandı → main'e merge + cleanup
  if (task.status === "MERGED") {
    await stopPreview(active.taskId, "onaylandı, main'e merge ediliyor");
    if (task.branchName) {
      try {
        await mergeBranchToMain(task.branchName, `merge: ${task.title}`);
        await emitAgentEvent({
          taskId: active.taskId,
          type: "COMMIT",
          summary: `main'e merge edildi: ${task.branchName}`,
          payload: { branch: task.branchName },
        });
        await destroyWorktree(active.taskId, task.branchName);
        await emitAgentEvent({
          taskId: active.taskId,
          type: "NOTE",
          summary: "Worktree ve branch temizlendi.",
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await emitAgentEvent({
          taskId: active.taskId,
          type: "ERROR",
          summary: `Merge hatası: ${msg.slice(0, 300)}`,
        });
      }
    }
    return true;
  }

  // Reddedildi veya iptal → cleanup, merge yok
  if (task.status === "REJECTED" || task.status === "CANCELLED") {
    const reason = task.status === "REJECTED" ? "reddedildi" : "iptal";
    await stopPreview(active.taskId, reason);
    if (task.branchName) {
      await destroyWorktree(active.taskId, task.branchName);
      await emitAgentEvent({
        taskId: active.taskId,
        type: "NOTE",
        summary: "Worktree ve branch temizlendi.",
      });
    }
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
