import "server-only";
import { db } from "@/lib/db";

export async function listRefundsForOrder(orderId: string) {
  return db.refund.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRefundedTotal(orderId: string): Promise<number> {
  const result = await db.refund.aggregate({
    where: { orderId, status: { in: ["PENDING", "COMPLETED"] } },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
}
