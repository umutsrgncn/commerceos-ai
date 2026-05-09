import "server-only";
import { db } from "@/lib/db";

export type CustomerSegmentStats = {
  customer_id: string;
  customer_age_days: number;
  total_orders: number;
  total_spent_minor: number;
  currency: string;
  average_basket_minor: number;
  cancelled_orders: number;
  refunded_orders: number;
  cancellation_rate: number;
  days_since_last_order: number | null;
};

/** Snapshot used as the LLM segmentation input. */
export async function buildCustomerStats(
  customerId: string
): Promise<CustomerSegmentStats | null> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: { id: true, createdAt: true },
  });
  if (!customer) return null;

  const orders = await db.order.findMany({
    where: { customerId },
    select: {
      total: true,
      currency: true,
      status: true,
      createdAt: true,
    },
  });

  const totalOrders = orders.length;
  const cancelled = orders.filter((o) => o.status === "CANCELLED").length;
  const refunded = orders.filter((o) => o.status === "REFUNDED").length;
  const valid = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "REFUNDED"
  );
  const totalSpent = valid.reduce((sum, o) => sum + o.total, 0);
  const lastOrderAt =
    orders.length === 0
      ? null
      : orders.reduce(
          (latest, o) => (o.createdAt > latest ? o.createdAt : latest),
          orders[0].createdAt
        );

  return {
    customer_id: customer.id,
    customer_age_days: Math.floor(
      (Date.now() - customer.createdAt.getTime()) / 86_400_000
    ),
    total_orders: totalOrders,
    total_spent_minor: totalSpent,
    currency: orders[0]?.currency ?? "TRY",
    average_basket_minor: valid.length > 0 ? Math.round(totalSpent / valid.length) : 0,
    cancelled_orders: cancelled,
    refunded_orders: refunded,
    cancellation_rate: totalOrders > 0 ? cancelled / totalOrders : 0,
    days_since_last_order: lastOrderAt
      ? Math.floor((Date.now() - lastOrderAt.getTime()) / 86_400_000)
      : null,
  };
}
