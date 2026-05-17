import { db } from "@/lib/db";
import type { RealAgentTask } from "@/components/landing/ai-developer";

/**
 * Son N MERGED agent task'ı landing/watch sayfasındaki "Gerçek tamamlanmış
 * görevler" kartlarına geçirilecek formatta döner.
 *
 * Süre = (completedAt - startedAt) dakika cinsinden; FILE_WRITE event sayısı
 * "files" alanı; agent iterasyon sayısı (TOOL_CALL + FILE_WRITE) "iter" alanı.
 */
export async function getRecentMergedAgentTasks(
  limit = 4,
): Promise<RealAgentTask[]> {
  const tasks = await db.agentTask.findMany({
    where: { status: "MERGED" },
    orderBy: { completedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      branchName: true,
      startedAt: true,
      completedAt: true,
    },
  });
  if (tasks.length === 0) return [];

  // Per-task event istatistikleri — paralel queries
  const stats = await Promise.all(
    tasks.map(async (t) => {
      const [fileWrites, toolCalls] = await Promise.all([
        db.agentEvent.findMany({
          where: { taskId: t.id, type: "FILE_WRITE" },
          select: { summary: true },
        }),
        db.agentEvent.count({
          where: {
            taskId: t.id,
            type: { in: ["TOOL_CALL", "FILE_WRITE"] },
          },
        }),
      ]);
      const distinctFiles = new Set(fileWrites.map((e) => e.summary)).size;
      return { taskId: t.id, files: distinctFiles, iter: toolCalls };
    }),
  );
  const statByTask = new Map(stats.map((s) => [s.taskId, s]));

  return tasks.map((t) => {
    const s = statByTask.get(t.id) ?? { files: 0, iter: 0 };
    const ms =
      t.completedAt && t.startedAt
        ? t.completedAt.getTime() - t.startedAt.getTime()
        : 0;
    const minutes = Math.max(1, Math.round(ms / 60_000));
    // Branch'ten scope çıkar: "agent/admin-products-..." → "admin_products"
    const scope = (t.branchName ?? "")
      .replace(/^agent\//, "")
      .split("-")
      .slice(0, 2)
      .join("_") || "general";
    const cleanTitle = t.title.replace(/^\(AGENT\):\s*/i, "").trim();
    return {
      title: cleanTitle,
      scope,
      iter: s.iter,
      files: Math.max(1, s.files),
      duration: `${minutes} dk`,
    };
  });
}
