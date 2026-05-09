import "server-only";
import { db } from "@/lib/db";

export async function listActivity(limit = 50) {
  return db.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
