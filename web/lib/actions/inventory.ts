"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  inventoryAdjustSchema,
  reorderLevelSchema,
} from "@/lib/schemas/inventory";

export type InventoryActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function adjustInventoryAction(
  _prev: InventoryActionState,
  formData: FormData
): Promise<InventoryActionState> {
  const session = await requireSession();

  const parsed = inventoryAdjustSchema.safeParse({
    productId: formData.get("productId"),
    delta: formData.get("delta"),
    reason: formData.get("reason") ?? "CORRECTION",
    note: formData.get("note") || null,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { productId, delta, reason, note } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      const inventory = await tx.inventory.upsert({
        where: { productId },
        create: { productId, quantity: Math.max(0, delta) },
        update: { quantity: { increment: delta } },
      });

      if (inventory.quantity < 0) {
        // upsert just bumped past zero; clamp and let the action surface error
        throw new Error("NEGATIVE_STOCK");
      }

      await tx.inventoryAdjustment.create({
        data: {
          inventoryId: inventory.id,
          delta,
          reason,
          note: note ?? null,
          userId: session.user.id,
        },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "NEGATIVE_STOCK") {
      return { error: "Stok eksiye düşemez. Daha düşük bir azaltma dene." };
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      return { error: `Veri tabanı hatası (${err.code}).` };
    }
    throw err;
  }

  // Otopilot: stok kritik seviyeye düştüyse tedarikçiye sipariş tetikle
  if (delta < 0) {
    try {
      const { autoReorderStockIfLow } = await import("@/lib/autopilot/core");
      await autoReorderStockIfLow(productId);
    } catch {
      // sessizce devam
    }
  }

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin");
  return null;
}

export async function setReorderLevelAction(formData: FormData) {
  await requireSession();

  const parsed = reorderLevelSchema.safeParse({
    productId: formData.get("productId"),
    reorderLevel: formData.get("reorderLevel"),
  });
  if (!parsed.success) return;

  const { productId, reorderLevel } = parsed.data;
  await db.inventory.update({
    where: { productId },
    data: { reorderLevel },
  });

  revalidatePath("/admin/inventory");
}
