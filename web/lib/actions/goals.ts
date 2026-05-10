"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getMonthlyRevenueHistory } from "@/lib/queries/goals";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

const setGoalSchema = z.object({
  period: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM olmalı"),
  targetAmount: z
    .union([z.string(), z.number()])
    .transform((val, ctx) => {
      const num = typeof val === "string" ? Number(val.replace(",", ".")) : val;
      if (!Number.isFinite(num) || num <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Hedef pozitif olmalı",
        });
        return z.NEVER;
      }
      return Math.round(num * 100);
    }),
  notes: z.string().max(400).optional().nullable(),
});

export type GoalActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

export async function setGoalAction(
  _prev: GoalActionState,
  formData: FormData
): Promise<GoalActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Yetkisiz." };

  const parsed = setGoalSchema.safeParse({
    period: formData.get("period"),
    targetAmount: formData.get("targetAmount"),
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  await db.salesGoal.upsert({
    where: { period: parsed.data.period },
    update: {
      targetAmount: parsed.data.targetAmount,
      notes: parsed.data.notes ?? null,
    },
    create: {
      period: parsed.data.period,
      targetAmount: parsed.data.targetAmount,
      notes: parsed.data.notes ?? null,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/finance");
  return { ok: true };
}

export type GoalSuggestResult =
  | {
      ok: true;
      target_minor: number;
      reasoning: string;
      ambition: "konservatif" | "dengeli" | "agresif";
    }
  | { ok: false; error: string };

export async function suggestGoalAction(
  ambition: "konservatif" | "dengeli" | "agresif" = "dengeli"
): Promise<GoalSuggestResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  const history = await getMonthlyRevenueHistory(6);
  if (history.every((h) => h.revenue === 0)) {
    return {
      ok: false,
      error: "Hedef önermek için en az bir ay satış geçmişi gerekli.",
    };
  }

  try {
    const res = await fetch(`${AI_BASE}/goals/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        history: history.map((h) => ({
          period: h.period,
          revenue_minor: h.revenue,
        })),
        ambition,
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
