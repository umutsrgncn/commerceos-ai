import "server-only";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export async function listAutoPilotActions(filters: {
  page?: number;
  pageSize?: number;
  type?: string;
  status?: string;
} = {}) {
  const { page = 1, pageSize = 50, type, status } = filters;
  const ands: Prisma.AutoPilotActionWhereInput[] = [];
  if (
    type &&
    [
      "REVIEW_REPLY",
      "INVOICE_ISSUE",
      "STOCK_REORDER",
      "BANK_MATCH",
      "ORDER_CONFIRM",
    ].includes(type)
  ) {
    ands.push({ type: type as Prisma.AutoPilotActionWhereInput["type"] });
  }
  if (
    status &&
    ["PENDING", "EXECUTED", "FAILED", "SKIPPED"].includes(status)
  ) {
    ands.push({ status: status as Prisma.AutoPilotActionWhereInput["status"] });
  }
  const where: Prisma.AutoPilotActionWhereInput = ands.length
    ? { AND: ands }
    : {};

  const [items, total] = await Promise.all([
    db.autoPilotAction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.autoPilotAction.count({ where }),
  ]);

  return { items, total, page, pageSize };
}

export async function getAutoPilotStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [byStatus, byType, weekTotal] = await Promise.all([
    db.autoPilotAction.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    db.autoPilotAction.groupBy({
      by: ["type"],
      where: { createdAt: { gte: weekAgo } },
      _count: { _all: true },
    }),
    db.autoPilotAction.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  const map = Object.fromEntries(
    byStatus.map((r) => [r.status, r._count._all]),
  );
  const typeMap = Object.fromEntries(
    byType.map((r) => [r.type, r._count._all]),
  );

  return {
    total: byStatus.reduce((s, r) => s + r._count._all, 0),
    weekTotal,
    executed: map.EXECUTED ?? 0,
    pending: map.PENDING ?? 0,
    failed: map.FAILED ?? 0,
    skipped: map.SKIPPED ?? 0,
    byType: typeMap,
  };
}
