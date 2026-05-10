"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { expenseCreateSchema, expenseUpdateSchema } from "@/lib/schemas/expenses";
import { recordActivity } from "@/lib/activity";

export type ExpenseActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
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
