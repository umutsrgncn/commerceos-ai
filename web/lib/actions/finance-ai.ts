"use server";

import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export type PriceSuggestResult =
  | {
      ok: true;
      productId: string;
      productName: string | null;
      currentPriceMinor: number;
      costPriceMinor: number | null;
      suggestedPriceMinor: number | null;
      suggestedMarginPct: number | null;
      currentMarginPct: number | null;
      expectedSalesChangePct: number | null;
      expectedProfitChangePct: number | null;
      confidence: number;
      reasoning: string;
      action: "increase" | "decrease" | "hold";
      sales30d: number;
      revenue30dMinor: number;
    }
  | { ok: false; error: string };

export async function suggestPriceAction(
  productId: string,
): Promise<PriceSuggestResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  try {
    const res = await fetch(`${AI_BASE}/pricing/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `AI servisi ${res.status}: ${t.slice(0, 200)}` };
    }
    const d = await res.json();
    if (!d.ok) {
      return { ok: false, error: d.error ?? "AI önerisi üretilemedi" };
    }
    const validAction = ["increase", "decrease", "hold"].includes(d.action)
      ? (d.action as "increase" | "decrease" | "hold")
      : "hold";
    return {
      ok: true,
      productId: d.product_id,
      productName: d.product_name ?? null,
      currentPriceMinor: d.current_price_minor,
      costPriceMinor: d.cost_price_minor ?? null,
      suggestedPriceMinor: d.suggested_price_minor ?? null,
      suggestedMarginPct: d.suggested_margin_pct ?? null,
      currentMarginPct: d.current_margin_pct ?? null,
      expectedSalesChangePct: d.expected_sales_change_pct ?? null,
      expectedProfitChangePct: d.expected_profit_change_pct ?? null,
      confidence: d.confidence ?? 0,
      reasoning: d.reasoning ?? "",
      action: validAction,
      sales30d: d.sales_30d ?? 0,
      revenue30dMinor: d.revenue_30d_minor ?? 0,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

export type OcrResult =
  | {
      ok: true;
      amountMinor: number | null;
      currency: string;
      vendor: string | null;
      date: string | null;
      description: string | null;
      categoryGuess: string | null;
      confidence: number;
      notes: string | null;
    }
  | { ok: false; error: string };

/** Gemini Vision ile fiş/fatura fotoğrafından alanları çıkar.
 *  imageDataUrl: 'data:image/jpeg;base64,...' ya da çıplak base64. */
export async function ocrReceiptAction(
  imageDataUrl: string,
  mimeType?: string,
): Promise<OcrResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };
  if (!imageDataUrl || imageDataUrl.length < 100) {
    return { ok: false, error: "Görsel boş veya çok küçük." };
  }
  let mt = mimeType ?? "image/jpeg";
  if (imageDataUrl.startsWith("data:")) {
    const m = imageDataUrl.match(/^data:([^;]+);base64,/);
    if (m) mt = m[1];
  }

  try {
    const res = await fetch(`${AI_BASE}/receipt/ocr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_b64: imageDataUrl, mime_type: mt }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return {
        ok: false,
        error: `AI servisi ${res.status}: ${txt.slice(0, 200)}`,
      };
    }
    const data = await res.json();
    if (!data.ok) {
      return { ok: false, error: data.error ?? "OCR başarısız" };
    }
    return {
      ok: true,
      amountMinor: data.amount_minor ?? null,
      currency: data.currency ?? "TRY",
      vendor: data.vendor ?? null,
      date: data.date ?? null,
      description: data.description ?? null,
      categoryGuess: data.category_guess ?? null,
      confidence: data.confidence ?? 0,
      notes: data.notes ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

export type CategorizeResult =
  | { ok: true; category: string; confidence: number; reasoning: string }
  | { ok: false; error: string };

export async function categorizeExpenseAction(
  description: string,
  vendor: string | null
): Promise<CategorizeResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };
  if (!description || description.trim().length < 2) {
    return { ok: false, error: "Önce açıklama yaz." };
  }

  try {
    const res = await fetch(`${AI_BASE}/finance/expense/categorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, vendor }),
    });
    if (!res.ok) {
      return { ok: false, error: `AI servisi ${res.status} döndü.` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata.",
    };
  }
}

// ─── Discount suggest ────────────────────────────────────────────────────────

export type DiscountSuggestResult =
  | {
      ok: true;
      code: string;
      type: "PERCENTAGE" | "FIXED";
      value: number;
      min_subtotal: number;
      days: number;
      description: string;
      reasoning: string;
    }
  | { ok: false; error: string };

import { db } from "@/lib/db";

export async function suggestDiscountAction(
  intent: "boost_sales" | "clear_inventory" | "loyalty" | "new_customer",
  season: "normal" | "summer" | "winter" | "ramadan" | "back_to_school"
): Promise<DiscountSuggestResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  // Hızlı snapshot: ortalama sepet ve aylık gelir
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const [orderAgg, top] = await Promise.all([
    db.order.aggregate({
      where: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.orderItem.groupBy({
      by: ["name"],
      where: {
        order: { createdAt: { gte: since }, status: { not: "CANCELLED" } },
      },
      _sum: { total: true },
      orderBy: { _sum: { total: "desc" } },
      take: 3,
    }),
  ]);

  const monthlyRevenue = orderAgg._sum.total ?? 0;
  const avgBasket =
    orderAgg._count._all > 0
      ? Math.round(monthlyRevenue / orderAgg._count._all)
      : 0;

  try {
    const res = await fetch(`${AI_BASE}/finance/discount/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        avg_basket_minor: avgBasket,
        monthly_revenue_minor: monthlyRevenue,
        top_categories: top.map((t) => t.name),
        season,
        intent,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `AI servisi ${res.status} döndü.` };
    }
    const data = await res.json();
    return { ok: true, ...data };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata.",
    };
  }
}
