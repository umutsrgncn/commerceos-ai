import "server-only";
import { db } from "@/lib/db";

export type CustomerSegmentStats = {
  customer_id: string;
  customer_age_days: number;
  total_orders: number;
  /** İnsan-okur formatlı toplam: "26.168,86 ₺" — AI metninde aynen kullanılır. */
  total_spent: string;
  /** İnsan-okur formatlı ortalama sepet: "2.180,74 ₺" — AI metninde aynen kullanılır. */
  average_basket: string;
  currency: string;
  cancelled_orders: number;
  refunded_orders: number;
  cancellation_rate: number;
  days_since_last_order: number | null;
};

function formatTRY(minor: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

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

  const avgMinor = valid.length > 0 ? Math.round(totalSpent / valid.length) : 0;

  return {
    customer_id: customer.id,
    customer_age_days: Math.floor(
      (Date.now() - customer.createdAt.getTime()) / 86_400_000
    ),
    total_orders: totalOrders,
    total_spent: formatTRY(totalSpent),
    average_basket: formatTRY(avgMinor),
    currency: orders[0]?.currency ?? "TRY",
    cancelled_orders: cancelled,
    refunded_orders: refunded,
    cancellation_rate: totalOrders > 0 ? cancelled / totalOrders : 0,
    days_since_last_order: lastOrderAt
      ? Math.floor((Date.now() - lastOrderAt.getTime()) / 86_400_000)
      : null,
  };
}
