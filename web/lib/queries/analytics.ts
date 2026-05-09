import "server-only";
import { db } from "@/lib/db";

export type RevenuePoint = { date: string; total: number; orders: number };

/**
 * Day-by-day revenue + order count for the last `days` days. Excludes
 * CANCELLED/REFUNDED so the chart matches accounting expectations.
 */
export async function getRevenueTrend(days = 30): Promise<RevenuePoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  const rows = await db.$queryRaw<
    Array<{ day: Date; total: bigint; orders: bigint }>
  >`
    SELECT
      date_trunc('day', "createdAt") AS day,
      COALESCE(SUM(total), 0)::bigint AS total,
      COUNT(*)::bigint AS orders
    FROM "Order"
    WHERE "createdAt" >= ${since}
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY day
    ORDER BY day ASC
  `;

  // Fill gap days with zeros so the chart has a continuous x axis.
  const map = new Map<string, { total: number; orders: number }>();
  for (const r of rows) {
    map.set(r.day.toISOString().slice(0, 10), {
      total: Number(r.total),
      orders: Number(r.orders),
    });
  }

  const out: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const key = d.toISOString().slice(0, 10);
    const entry = map.get(key) ?? { total: 0, orders: 0 };
    out.push({ date: key, ...entry });
  }
  return out;
}

export async function getTopProducts(days = 30, limit = 8) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.orderItem.groupBy({
    by: ["productId", "name"],
    where: {
      order: {
        createdAt: { gte: since },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    units: r._sum.quantity ?? 0,
    revenue: r._sum.total ?? 0,
  }));
}

export async function getStatusBreakdown(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const rows = await db.order.groupBy({
    by: ["status"],
    where: { createdAt: { gte: since } },
    _count: { _all: true },
    _sum: { total: true },
  });

  return rows.map((r) => ({
    status: r.status,
    count: r._count._all,
    revenue: r._sum.total ?? 0,
  }));
}
