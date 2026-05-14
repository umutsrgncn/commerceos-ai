"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCustomer } from "@/lib/shop/auth";
import { RequestDeletionState } from "./delete-account-form";

export async function requestAccountDeletion(
  prevState: RequestDeletionState,
  formData: FormData,
): Promise<RequestDeletionState> {
  const customer = await requireCustomer();
  const reason = formData.get("reason") as string | null;

  try {
    await db.dataDeletionRequest.create({
      data: {
        customerId: customer.id,
        customerEmail: customer.email,
        reason: reason,
        status: "PENDING",
      },
    });

    revalidatePath("/shop/account/settings");

    return { ok: true, message: "Hesap silme talebiniz başarıyla alındı." };
  } catch (error) {
    console.error("Hesap silme talebi oluşturulurken hata oluştu:", error);
    return { ok: false, error: "Hesap silme talebi oluşturulurken bir hata oluştu." };
  }
}
