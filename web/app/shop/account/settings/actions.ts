"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/shop/auth";

export type RequestDeletionState =
  | { ok: true; message: string }
  | { ok: false; error: string }
  | null;

export async function requestAccountDeletion(
  _prev: RequestDeletionState,
  formData: FormData,
): Promise<RequestDeletionState> {
  const customer = await requireCustomer();
  const rawReason = (formData.get("reason") ?? "").toString().trim();
  const reason = rawReason.length > 0 ? rawReason.slice(0, 2000) : null;

  // Idempotency — açık bir PENDING/APPROVED talep varsa yenisini açma
  const existing = await db.dataDeletionRequest.findFirst({
    where: {
      customerId: customer.id,
      status: { in: ["PENDING", "APPROVED"] },
    },
    select: { id: true },
  });
  if (existing) {
    return {
      ok: false,
      error: "Zaten incelenen bir silme talebin var.",
    };
  }

  try {
    await db.dataDeletionRequest.create({
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name ?? null,
        reason,
        status: "PENDING",
      },
    });

    revalidatePath("/shop/account/settings");
    revalidatePath("/admin/data-requests");
    return { ok: true, message: "Talebin alındı." };
  } catch (err) {
    console.error("KVKK silme talebi oluşturulamadı:", err);
    return { ok: false, error: "Talep alınırken bir sorun oluştu, tekrar dene." };
  }
}
