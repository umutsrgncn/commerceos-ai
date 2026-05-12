import { db } from "@/lib/db";
import { runTask } from "./runner";

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
