import "server-only";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";

/**
 * Records an admin-side mutation to ActivityLog. Failures here are
 * swallowed: we never want telemetry to take down the user's primary
 * action. Wrap your domain mutation in a try/catch separately if you
 * need transactional guarantees.
 */
export async function recordActivity(input: {
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const session = await auth();
    await db.activityLog.create({
      data: {
        action: input.action,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        userId: session?.user?.id ?? null,
        userName: session?.user?.name ?? session?.user?.email ?? null,
        metadata: (input.metadata ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    console.error("[activity] recordActivity failed:", err);
  }
}
