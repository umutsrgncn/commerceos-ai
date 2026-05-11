"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { recordActivity } from "@/lib/activity";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

async function requireSession() {
  return requireRole("MANAGER");
}

export type CampaignSuggestion = {
  ok: true;
  productId: string;
  productName: string;
  suggestedDiscountPct: number;
  suggestedCode: string;
  campaignType: string;
  durationDays: number;
  minSubtotalMinor: number | null;
  targetAudience: string | null;
  messaging: string | null;
  reasoning: string;
  expectedOutcome: string;
  riskWarning: string | null;
  confidence: number;
  currentPriceMinor: number;
  costPriceMinor: number | null;
  currentMarginPct: number | null;
  newMarginPctAfterDiscount: number | null;
  stockQuantity: number;
  soldLast60d: number;
  daysSinceLastSale: number | null;
};

export type SuggestCampaignResult =
  | CampaignSuggestion
  | { ok: false; error: string };

/** AI'ye yavaş hareket eden ürün için kampanya öner. Otopilot durumundan
 *  bağımsız çalışır — kullanıcı manuel olarak da çağırabilir. */
export async function suggestDeadStockCampaignAction(
  productId: string,
): Promise<SuggestCampaignResult> {
  await requireSession();
  if (!productId) return { ok: false, error: "Geçersiz ürün" };

  try {
    const res = await fetch(`${AI_BASE}/products/dead-stock-campaign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return {
        ok: false,
        error: `AI servisi ${res.status}: ${t.slice(0, 200)}`,
      };
    }
    const d = await res.json();
    if (!d.ok) {
      return { ok: false, error: d.error ?? "AI önerisi alınamadı" };
    }
    return {
      ok: true,
      productId: d.product_id,
      productName: d.product_name ?? "",
      suggestedDiscountPct: d.suggested_discount_pct ?? 0,
      suggestedCode: d.suggested_code ?? "",
      campaignType: d.campaign_type ?? "DISCOUNT_PERCENTAGE",
      durationDays: d.duration_days ?? 14,
      minSubtotalMinor: d.min_subtotal_minor ?? null,
      targetAudience: d.target_audience ?? null,
      messaging: d.messaging ?? null,
      reasoning: d.reasoning ?? "",
      expectedOutcome: d.expected_outcome ?? "",
      riskWarning: d.risk_warning ?? null,
      confidence: d.confidence ?? 0,
      currentPriceMinor: d.current_price_minor ?? 0,
      costPriceMinor: d.cost_price_minor ?? null,
      currentMarginPct: d.current_margin_pct ?? null,
      newMarginPctAfterDiscount: d.new_margin_pct_after_discount ?? null,
      stockQuantity: d.stock_quantity ?? 0,
      soldLast60d: d.sold_last_60d ?? 0,
      daysSinceLastSale: d.days_since_last_sale ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

/** AI önerisini Discount kodu olarak DB'ye yaz. Otopilot ON ise
 *  AutoPilotAction da loglanır (hackathon scope: manuel apply). */
export async function applyCampaignSuggestionAction(input: {
  productId: string;
  productName: string;
  code: string;
  discountPct: number;
  durationDays: number;
  minSubtotalMinor: number | null;
  description: string;
}): Promise<{ ok: boolean; error?: string; discountId?: string }> {
  await requireSession();

  if (!input.code || input.code.length < 3) {
    return { ok: false, error: "Kampanya kodu geçersiz" };
  }
  if (input.discountPct < 1 || input.discountPct > 80) {
    return { ok: false, error: "İndirim %1-80 aralığında olmalı" };
  }

  // Kod çakışması varsa unique suffix ekle
  let code = input.code.toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const existing = await db.discount.findUnique({ where: { code } });
  if (existing) {
    code = `${code}-${Date.now().toString(36).toUpperCase().slice(-4)}`;
  }

  const startsAt = new Date();
  const endsAt = new Date(
    Date.now() + input.durationDays * 24 * 60 * 60 * 1000,
  );

  const discount = await db.discount.create({
    data: {
      code,
      description: input.description,
      type: "PERCENTAGE",
      value: input.discountPct,
      minSubtotal: input.minSubtotalMinor ?? 0,
      startsAt,
      endsAt,
      isActive: true,
    },
  });

  await recordActivity({
    action: "campaign.dead_stock_apply",
    entityType: "product",
    entityId: input.productId,
    metadata: {
      discountId: discount.id,
      discountCode: code,
      discountPct: input.discountPct,
      productName: input.productName,
      durationDays: input.durationDays,
    },
  });

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/products/${input.productId}`);

  return { ok: true, discountId: discount.id };
}
