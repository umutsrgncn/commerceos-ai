"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import { expenseCreateSchema, expenseUpdateSchema } from "@/lib/schemas/expenses";
import { recordActivity } from "@/lib/activity";

export type ExpenseActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  return requireRole("MANAGER");
}

function rawForm(formData: FormData) {
  return {
    date: formData.get("date"),
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "TRY",
    category: formData.get("category") ?? "OTHER",
    description: formData.get("description"),
    vendor: formData.get("vendor") || null,
    reference: formData.get("reference") || null,
    recurringRule: formData.get("recurringRule") || null,
  };
}

export async function createExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  const session = await requireSession();

  const parsed = expenseCreateSchema.safeParse(rawForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const created = await db.expense.create({
    data: {
      ...parsed.data,
      vendor: parsed.data.vendor ?? null,
      reference: parsed.data.reference ?? null,
      userId: session.user.id,
    },
  });

  await recordActivity({
    action: "expense.create",
    entityType: "expense",
    entityId: created.id,
    metadata: {
      amount: parsed.data.amount,
      category: parsed.data.category,
    },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  redirect("/admin/expenses");
}

export async function updateExpenseAction(
  _prev: ExpenseActionState,
  formData: FormData
): Promise<ExpenseActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz kayıt." };

  const parsed = expenseUpdateSchema.safeParse({ id, ...rawForm(formData) });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id: expenseId, ...data } = parsed.data;

  await db.expense.update({
    where: { id: expenseId },
    data: {
      ...data,
      vendor: data.vendor ?? null,
      reference: data.reference ?? null,
    },
  });

  revalidatePath("/admin/expenses");
  revalidatePath(`/admin/expenses/${expenseId}`);
  revalidatePath("/admin/finance");
  return { error: undefined };
}

export async function deleteExpenseAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db.expense.delete({ where: { id } });
  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
}

/** Tekrarlayan giderleri 'şimdi' üret. Aktif rule'lu her template için
 *  bu ay zaten üretilmiş mi kontrol et, yoksa yeni Expense oluştur. */
export async function generateRecurringExpensesAction(): Promise<{
  ok: boolean;
  generated: number;
  skipped: number;
  error?: string;
}> {
  const session = await requireSession();

  const templates = await db.expense.findMany({
    where: {
      recurringRule: { not: null },
      recurringParentId: null, // sadece template'ler (turevler değil)
    },
  });

  let generated = 0;
  let skipped = 0;

  const now = new Date();
  for (const t of templates) {
    if (!t.recurringRule) continue;

    // Bu rule için son türev ne zaman oluşturuldu?
    const lastChild = await db.expense.findFirst({
      where: { recurringParentId: t.id },
      orderBy: { date: "desc" },
    });

    const baseDate = lastChild?.date ?? t.date;
    const next = computeNextOccurrence(baseDate, t.recurringRule);

    if (next > now) {
      // Henüz vakti gelmedi
      skipped++;
      continue;
    }

    await db.expense.create({
      data: {
        date: next,
        amount: t.amount,
        currency: t.currency,
        category: t.category,
        description: `${t.description} (otomatik)`,
        vendor: t.vendor,
        reference: t.reference,
        userId: session.user!.id,
        recurringParentId: t.id,
      },
    });
    generated++;
  }

  await recordActivity({
    action: "expense.recurring_generate",
    metadata: { generated, skipped, templateCount: templates.length },
  });

  revalidatePath("/admin/expenses");
  revalidatePath("/admin/finance");
  return { ok: true, generated, skipped };
}

function computeNextOccurrence(base: Date, rule: string): Date {
  const next = new Date(base);
  switch (rule) {
    case "MONTHLY":
      next.setMonth(next.getMonth() + 1);
      break;
    case "WEEKLY":
      next.setDate(next.getDate() + 7);
      break;
    case "QUARTERLY":
      next.setMonth(next.getMonth() + 3);
      break;
    case "YEARLY":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      break;
  }
  return next;
}
