import "server-only";
import { db } from "@/lib/db";

function startOfDay(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeek(d: Date = new Date()): Date {
  const x = startOfDay(d);
  // Monday-based week (Türkiye standardı)
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

export type DashboardStats = {
  revenueToday: { total: number; currency: string };
  ordersToday: number;
  newCustomersThisWeek: number;
  lowStockCount: number;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = startOfDay();
  const weekStart = startOfWeek();

  const [revenueRows, ordersToday, newCustomersThisWeek, lowStockCount] =
    await Promise.all([
      // group by currency in case the shop sells in multiple
      db.order.groupBy({
        by: ["currency"],
        where: {
          createdAt: { gte: today },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { total: true },
      }),
      db.order.count({
        where: {
          createdAt: { gte: today },
          status: { notIn: ["CANCELLED"] },
        },
      }),
      db.customer.count({
        where: { createdAt: { gte: weekStart } },
      }),
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE p.status = 'PUBLISHED' AND i.quantity <= i."reorderLevel"
      `.then((rows) => Number(rows[0]?.count ?? 0)),
    ]);

  // Pick the dominant currency for the revenue card; fall back to TRY.
  const top = revenueRows.sort(
    (a, b) => (b._sum.total ?? 0) - (a._sum.total ?? 0)
  )[0];

  return {
    revenueToday: {
      total: top?._sum.total ?? 0,
      currency: top?.currency ?? "TRY",
    },
    ordersToday,
    newCustomersThisWeek,
    lowStockCount,
  };
}

export async function getRecentOrders(limit = 8) {
  return db.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      customer: { select: { id: true, name: true } },
      _count: { select: { items: true } },
    },
  });
}
