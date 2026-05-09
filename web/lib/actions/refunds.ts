"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { refundCreateSchema } from "@/lib/schemas/refunds";

export type RefundActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function createRefundAction(
  _prev: RefundActionState,
  formData: FormData
): Promise<RefundActionState> {
  const session = await requireSession();

  const parsed = refundCreateSchema.safeParse({
    orderId: formData.get("orderId"),
    amount: formData.get("amount"),
    reason: formData.get("reason") ?? "CUSTOMER_REQUEST",
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { orderId, amount, reason, notes } = parsed.data;

  const order = await db.order.findUnique({
    where: { id: orderId },
    select: { total: true, status: true },
  });
  if (!order) return { error: "Sipariş bulunamadı." };

  // Sum of pending/completed refunds before this one
  const existing = await db.refund.aggregate({
    where: { orderId, status: { in: ["PENDING", "COMPLETED"] } },
    _sum: { amount: true },
  });
  const alreadyRefunded = existing._sum.amount ?? 0;
  if (alreadyRefunded + amount > order.total) {
    return {
      fieldErrors: {
        amount: [
          "Toplam iade siparişin tutarını aşamaz.",
        ],
      },
    };
  }

  await db.$transaction(async (tx) => {
    await tx.refund.create({
      data: {
        orderId,
        amount,
        reason,
        notes: notes ?? null,
        userId: session.user.id,
        status: "PENDING",
      },
    });

    // Tam iade tamamen ödendiyse siparişi REFUNDED'a düşür.
    const fullyRefunded = alreadyRefunded + amount === order.total;
    if (fullyRefunded && order.status !== "REFUNDED") {
      await tx.order.update({
        where: { id: orderId },
        data: { status: "REFUNDED" },
      });
    }
  });

  await recordActivity({
    action: "refund.create",
    entityType: "order",
    entityId: orderId,
    metadata: { amount, reason },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return null;
}

export async function markRefundCompletedAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  const orderId = formData.get("orderId");
  if (typeof id !== "string" || typeof orderId !== "string") return;
  await db.refund.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function markRefundRejectedAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  const orderId = formData.get("orderId");
  if (typeof id !== "string" || typeof orderId !== "string") return;
  await db.refund.update({ where: { id }, data: { status: "REJECTED" } });
  revalidatePath(`/admin/orders/${orderId}`);
}
