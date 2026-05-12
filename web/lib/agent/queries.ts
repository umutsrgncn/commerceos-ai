import "server-only";
import { db } from "@/lib/db";
import type { AgentTaskStatus } from "@prisma/client";

export async function listAgentTasks(opts?: { status?: AgentTaskStatus; limit?: number }) {
  return db.agentTask.findMany({
    where: opts?.status ? { status: opts.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 50,
    select: {
      id: true,
      title: true,
      status: true,
      branchName: true,
      tunnelUrl: true,
      port: true,
      iterations: true,
      tokensUsed: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      _count: { select: { events: true, testRuns: true, screenshots: true } },
    },
  });
}

export async function getAgentTask(id: string) {
  return db.agentTask.findUnique({
    where: { id },
    include: {
      events: {
        orderBy: { seq: "asc" },
        take: 500,
      },
      screenshots: {
        orderBy: { createdAt: "asc" },
      },
      testRuns: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listAgentTaskStats() {
  const grouped = await db.agentTask.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const map: Record<string, number> = {};
  for (const row of grouped) map[row.status] = row._count._all;
  return {
    total: grouped.reduce((a, b) => a + b._count._all, 0),
    pending: map.PENDING ?? 0,
    running: (map.PLANNING ?? 0) + (map.RUNNING ?? 0) + (map.TESTING ?? 0),
    review: map.REVIEW ?? 0,
    merged: map.MERGED ?? 0,
    rejected: map.REJECTED ?? 0,
    failed: map.FAILED ?? 0,
  };
}

export async function listAgentEventsSince(taskId: string, sinceSeq: number) {
  return db.agentEvent.findMany({
    where: { taskId, seq: { gt: sinceSeq } },
    orderBy: { seq: "asc" },
    take: 200,
  });
}
