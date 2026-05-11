"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export type ApprovalResult = { ok: boolean; error?: string };

/** Fiyat önerisi (price scan) AutoPilotAction'ı için onayla → ürün fiyatı güncelle. */
export async function approvePriceSuggestionAction(
  actionId: string,
): Promise<ApprovalResult> {
  await requireSession();

  const action = await db.autoPilotAction.findUnique({
    where: { id: actionId },
  });
  if (!action) return { ok: false, error: "Aksiyon bulunamadı" };
  if (action.status !== "SKIPPED")
    return { ok: false, error: "Onay bekleyen aksiyon değil" };

  const meta = (action.metadata as Record<string, unknown>) ?? {};
  const productId = meta.productId as string | undefined;
  const newPrice = meta.suggestedPriceMinor as number | undefined;

  if (!productId || !newPrice) {
    return { ok: false, error: "Geçersiz öneri (ürün/fiyat eksik)" };
  }

  await db.product.update({
    where: { id: productId },
    data: { price: newPrice },
  });

  await db.autoPilotAction.update({
    where: { id: actionId },
    data: {
      status: "EXECUTED",
      executedAt: new Date(),
      decision: action.decision + " (manuel onaylandı)",
    },
  });

  await recordActivity({
    action: "product.price.ai_apply",
    entityType: "product",
    entityId: productId,
    metadata: {
      name: meta.productName,
      newPriceMinor: newPrice,
      approved: true,
    },
  });

  revalidatePath("/admin/autopilot");
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

/** SKIPPED bir aksiyonu geri alıp 'IGNORED' (alakasız) işaretle. */
export async function rejectAutoPilotActionAction(
  actionId: string,
): Promise<ApprovalResult> {
  await requireSession();

  await db.autoPilotAction.update({
    where: { id: actionId },
    data: {
      status: "FAILED",
      executedAt: new Date(),
      errorMessage: "Kullanıcı reddetti",
    },
  });

  revalidatePath("/admin/autopilot");
  return { ok: true };
}

/** Manuel olarak fiyat tarayıcısını çalıştır (autoSuggestPrice ON gerekir). */
export async function runPriceScanAction(): Promise<{
  ok: boolean;
  scanned?: number;
  suggested?: number;
  error?: string;
}> {
  await requireSession();
  try {
    const { runPriceSuggestionScan } = await import("@/lib/autopilot/core");
    const r = await runPriceSuggestionScan({ productLimit: 10 });
    revalidatePath("/admin/autopilot");
    return { ok: true, scanned: r.scanned, suggested: r.suggested };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Hata",
    };
  }
}
