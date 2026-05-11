import "server-only";
import { db } from "@/lib/db";

export async function listPaymentsForOrder(orderId: string) {
  return db.payment.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}
