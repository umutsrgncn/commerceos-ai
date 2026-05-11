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

  const until = new Date();
  until.setHours(23, 59, 59, 999);

  // Yerel TZ'ye göre gruplama yap — UTC midnight ile yerel midnight arasındaki
  // kayma günü farklı bucket'a düşürüyordu (TR +03:00 için 1 gün geride).
  const rows = await db.$queryRaw<
    Array<{ day_str: string; total: bigint; orders: bigint }>
  >`
    SELECT
      to_char(date_trunc('day', "createdAt" AT TIME ZONE 'Europe/Istanbul'), 'YYYY-MM-DD') AS day_str,
      COALESCE(SUM(total), 0)::bigint AS total,
      COUNT(*)::bigint AS orders
    FROM "Order"
    WHERE "createdAt" >= ${since}
      AND "createdAt" <= ${until}
      AND status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY day_str
    ORDER BY day_str ASC
  `;

  const map = new Map<string, { total: number; orders: number }>();
  for (const r of rows) {
    map.set(r.day_str, {
      total: Number(r.total),
      orders: Number(r.orders),
    });
  }

  const out: RevenuePoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    // Yerel tarih string'i — toISOString TZ kayması yaratıyor
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const key = `${yyyy}-${mm}-${dd}`;
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
