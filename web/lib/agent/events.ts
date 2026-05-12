import "server-only";
import { db } from "@/lib/db";
import type { AgentEventType, Prisma } from "@prisma/client";

/**
 * Yeni agent event'i yaz. Seq otomatik artar — task ölçeğinde unique.
 * Worker tarafından çağrılır (Node worker). Next API rotaları sadece okur ve SSE'ye iter.
 */
export async function emitAgentEvent(input: {
  taskId: string;
  type: AgentEventType;
  summary: string;
  payload?: Prisma.InputJsonValue;
}) {
  const last = await db.agentEvent.findFirst({
    where: { taskId: input.taskId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  const nextSeq = (last?.seq ?? 0) + 1;
  return db.agentEvent.create({
    data: {
      taskId: input.taskId,
      seq: nextSeq,
      type: input.type,
      summary: input.summary,
      payload: input.payload,
    },
  });
}
