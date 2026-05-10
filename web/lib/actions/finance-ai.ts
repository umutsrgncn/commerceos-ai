"use server";

import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

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
