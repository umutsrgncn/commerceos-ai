import path from "node:path";

import { db } from "@/lib/db";
import { emitAgentEvent } from "./events";
import { getActivePreview, startPreview, stopPreview } from "./preview";
import { runTaskWithAgent as runTask } from "./agent-runner";
import { destroyWorktree, mergeBranchToMain, pushMainToOrigin, type Worktree } from "./worktree";

const POLL_INTERVAL_MS = 3000;
const STALE_RECOVERY_MS = 3 * 60_000; // 3 dk hareket yoksa zombie say
const STALE_CHECK_INTERVAL_MS = 60_000; // 1 dk'da bir tara

const ACTIVE_STATUSES = ["PLANNING", "RUNNING", "TESTING"] as const;

let stopped = false;
let lastStaleCheck = 0;

export function stopWorker() {
  stopped = true;
}

/**
 * Worker restart edildiğinde önceki süreçten kalan PLANNING/RUNNING/TESTING
 * task'lar bellekte sahipsiz kalıyor — son event veya startedAt 3dk+ eskiyse
 * FAILED'a çek ki yeni task'lar pickup edilebilsin.
 */
async function recoverStaleActiveTasks() {
  const now = Date.now();
  const cutoff = new Date(now - STALE_RECOVERY_MS);
  const stale = await db.agentTask.findMany({
    where: {
      status: { in: [...ACTIVE_STATUSES] },
      startedAt: { lt: cutoff },
    },
    select: { id: true, status: true, startedAt: true },
  });
  for (const t of stale) {
    // Son event 3dk'dan eski mi?
    const lastEvent = await db.agentEvent.findFirst({
      where: { taskId: t.id },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const lastActivity = lastEvent?.createdAt ?? t.startedAt;
    if (!lastActivity || lastActivity.getTime() < cutoff.getTime()) {
      // eslint-disable-next-line no-console
      console.log(
        `[agent/worker] stale ${t.status} task kurtarılıyor: ${t.id} (son hareket: ${lastActivity?.toISOString() ?? "yok"})`,
      );
      await db.agentTask.update({
        where: { id: t.id },
        data: {
          status: "FAILED",
          errorMsg:
            "Worker restart edildiği sırada bu task aktifti — süreç sahipsiz kaldı, kurtarıldı.",
          completedAt: new Date(),
          tunnelUrl: null,
          port: null,
        },
      });
      try {
        await emitAgentEvent({
          taskId: t.id,
          type: "ERROR",
          summary:
            "Worker restart edildi, task sahipsiz kaldı → FAILED. Yeniden çalıştırmak istersen yeni task aç.",
        });
      } catch {}
    }
  }
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
  // Startup'ta önceki süreçten kalan zombie task'ları temizle
  try {
    await recoverStaleActiveTasks();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[agent/worker] startup stale recovery hata:", err);
  }
  while (!stopped) {
    try {
      // Periyodik stale check (her 60 sn'de bir)
      if (Date.now() - lastStaleCheck > STALE_CHECK_INTERVAL_MS) {
        lastStaleCheck = Date.now();
        await recoverStaleActiveTasks().catch((e) => {
          // eslint-disable-next-line no-console
          console.error("[agent/worker] periyodik stale check hata:", e);
        });
      }
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
        // GitHub'a push — VPS deploy key'i read-only ise hata fırlatır.
        // Merge YEREL'de zaten yapıldı, push fail olsa bile cleanup'a devam et.
        let pushOk = true;
        let pushErr: string | null = null;
        try {
          await pushMainToOrigin();
          await emitAgentEvent({
            taskId,
            type: "COMMIT",
            summary: "GitHub'a push edildi (origin/main).",
          });
        } catch (pErr) {
          pushOk = false;
          pushErr = pErr instanceof Error ? pErr.message : String(pErr);
          await emitAgentEvent({
            taskId,
            type: "ERROR",
            summary: `Push edilemedi (VPS deploy key read-only olabilir): ${pushErr.slice(0, 250)} — manuel push gerekli.`,
          });
        }
        await destroyWorktree(taskId, task.branchName);
        await emitAgentEvent({
          taskId,
          type: "NOTE",
          summary: "Worktree ve branch temizlendi.",
        });
        await restartWebService(taskId);
        await db.agentTask.update({
          where: { id: taskId },
          data: {
            tunnelUrl: null,
            port: null,
            completedAt: new Date(),
            errorMsg: pushOk
              ? null
              : `Merge OK ama GitHub push fail — manuel push gerekli. ${pushErr ?? ""}`.slice(0, 1000),
          },
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

  // PENDING/PLANNING/RUNNING/TESTING/FAILED — bu fonksiyon ele almaz.
  // Özellikle PENDING: kullanıcı feedback gönderince task REVIEW → PENDING'e
  // geçer. Eski preview hâlâ in-memory active olabilir; runner yeni iterasyon
  // başlatınca eskisini kapatır. false dön → worker claimNextTask'a insin.
  return false;
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

/**
 * Merge sonrası canlı deploy:
 *  1. /opt/commerceos/web'de `pnpm build` (kaynaktan .next bundle üret)
 *  2. systemctl restart commerceos-web (yeni bundle'ı yükle)
 *
 * Sadece systemctl restart yetmiyor — Next prod server `.next/`'i okur, kaynak
 * .tsx değişikliği için build şart. Agent task'larında bunu unuttuğumuzda
 * merge görünür ama canlıda eski kod kalıyordu.
 */
async function restartWebService(taskId: string): Promise<void> {
  const { spawn } = await import("node:child_process");
  const webDir = (process.env.AGENT_REPO_ROOT ?? "/opt/commerceos") + "/web";

  // ── 1) pnpm build ──
  await emitAgentEvent({
    taskId,
    type: "NOTE",
    summary: "Canlıya derleniyor (pnpm build)…",
  });
  const buildOk = await new Promise<boolean>((resolve) => {
    const child = spawn("pnpm", ["build"], {
      cwd: webDir,
      stdio: "ignore",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });
    child.on("close", (code) => resolve(code === 0));
    child.on("error", () => resolve(false));
    // 4 dk üst sınır — Next build genelde 1-2 dk
    setTimeout(() => {
      try {
        child.kill("SIGTERM");
      } catch {}
      resolve(false);
    }, 4 * 60_000);
  });
  if (!buildOk) {
    await emitAgentEvent({
      taskId,
      type: "ERROR",
      summary:
        "Canlı build başarısız — main'e merge edildi ama .next eski. Manuel müdahale gerek (pnpm build && systemctl restart commerceos-web).",
    });
    return;
  }

  // ── 2) systemctl restart ──
  await emitAgentEvent({
    taskId,
    type: "NOTE",
    summary: "Build tamam, web servisi yeniden başlatılıyor…",
  });
  await new Promise<void>((resolve) => {
    const child = spawn("systemctl", ["restart", "commerceos-web"], {
      stdio: "ignore",
      detached: true,
    });
    child.on("close", () => resolve());
    child.on("error", () => resolve());
    setTimeout(() => resolve(), 15_000);
  });
  await emitAgentEvent({
    taskId,
    type: "NOTE",
    summary: "Canlı güncellendi.",
  });
}
