import "server-only";
import { db } from "@/lib/db";

export async function listPaymentsForOrder(orderId: string) {
  // gatewayToken / rawInit / rawCallback HARİÇ — bunlar iyzico session/token
  // verisi, UI'da gerekli değil, sızdırılırsa hijack riski.
  return db.payment.findMany({
    where: { orderId },
    select: {
      id: true,
      orderId: true,
      gateway: true,
      status: true,
      amountMinor: true,
      currency: true,
      paymentLink: true,
      paidAt: true,
      errorMessage: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
