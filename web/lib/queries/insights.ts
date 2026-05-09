import "server-only";
import { db } from "@/lib/db";

export type InsightsPayload = {
  period_label: string;
  stats: {
    revenue_by_currency: Array<{ currency: string; total_minor: number; orders: number }>;
    orders_by_status: Array<{ status: string; count: number }>;
    top_products: Array<{
      productId: string;
      name: string;
      sku: string;
      units_sold: number;
      revenue_minor: number;
    }>;
    new_customers: number;
    cancellation_rate: number;
    low_stock_alerts: number;
    period_days: number;
  };
};

/**
 * Aggregates the last `days` of activity into a JSON-friendly summary that
 * can be safely shipped to Gemini for narrative analysis.
 */
export async function buildInsightsPayload(days = 30): Promise<InsightsPayload> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [revenue, byStatus, topProducts, newCustomers, lowStock, totalOrders, cancelled] =
    await Promise.all([
      db.order.groupBy({
        by: ["currency"],
        where: {
          createdAt: { gte: since },
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
        _sum: { total: true },
        _count: { _all: true },
      }),
      db.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      db.orderItem.groupBy({
        by: ["productId", "name"],
        where: {
          order: {
            createdAt: { gte: since },
            status: { notIn: ["CANCELLED", "REFUNDED"] },
          },
        },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      db.customer.count({ where: { createdAt: { gte: since } } }),
      db.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count
        FROM "Inventory" i
        JOIN "Product" p ON p.id = i."productId"
        WHERE p.status = 'PUBLISHED' AND i.quantity <= i."reorderLevel"
      `.then((rows) => Number(rows[0]?.count ?? 0)),
      db.order.count({ where: { createdAt: { gte: since } } }),
      db.order.count({
        where: { createdAt: { gte: since }, status: "CANCELLED" },
      }),
    ]);

  const productLookup = new Map(
    (
      await db.product.findMany({
        where: { id: { in: topProducts.map((p) => p.productId) } },
        select: { id: true, sku: true },
      })
    ).map((p) => [p.id, p.sku])
  );

  return {
    period_label: `Son ${days} gün`,
    stats: {
      revenue_by_currency: revenue.map((r) => ({
        currency: r.currency,
        total_minor: r._sum.total ?? 0,
        orders: r._count._all,
      })),
      orders_by_status: byStatus.map((s) => ({
        status: s.status,
        count: s._count._all,
      })),
      top_products: topProducts.map((p) => ({
        productId: p.productId,
        name: p.name,
        sku: productLookup.get(p.productId) ?? "",
        units_sold: p._sum.quantity ?? 0,
        revenue_minor: p._sum.total ?? 0,
      })),
      new_customers: newCustomers,
      cancellation_rate: totalOrders > 0 ? cancelled / totalOrders : 0,
      low_stock_alerts: lowStock,
      period_days: days,
    },
  };
}
