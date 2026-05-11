"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import {
  scheduledPaymentCreateSchema,
  scheduledPaymentUpdateSchema,
} from "@/lib/schemas/scheduled-payments";
import { recordActivity } from "@/lib/activity";

export type ScheduledPaymentActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  return requireRole("MANAGER");
}

function rawForm(formData: FormData) {
  return {
    name: formData.get("name"),
    amount: formData.get("amount"),
    currency: formData.get("currency") ?? "TRY",
    category: formData.get("category") ?? "OTHER",
    recurrence: formData.get("recurrence") ?? "MONTHLY",
    dueDay: formData.get("dueDay") ?? "1",
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate") ?? "",
    vendor: formData.get("vendor") || null,
    notes: formData.get("notes") || null,
    active: formData.get("active") ?? "on",
  };
}

export async function createScheduledPaymentAction(
  _prev: ScheduledPaymentActionState,
  formData: FormData,
): Promise<ScheduledPaymentActionState> {
  await requireSession();

  const parsed = scheduledPaymentCreateSchema.safeParse(rawForm(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const created = await db.scheduledPayment.create({
    data: {
      ...parsed.data,
      vendor: parsed.data.vendor ?? null,
      notes: parsed.data.notes ?? null,
      endDate: parsed.data.endDate ?? null,
    },
  });

  await recordActivity({
    action: "scheduled_payment.create",
    entityType: "scheduled_payment",
    entityId: created.id,
    metadata: {
      amount: parsed.data.amount,
      category: parsed.data.category,
      recurrence: parsed.data.recurrence,
    },
  });

  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/scheduled");
  redirect("/admin/finance/scheduled");
}

export async function updateScheduledPaymentAction(
  _prev: ScheduledPaymentActionState,
  formData: FormData,
): Promise<ScheduledPaymentActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz kayıt." };

  const parsed = scheduledPaymentUpdateSchema.safeParse({
    id,
    ...rawForm(formData),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { id: paymentId, ...data } = parsed.data;

  await db.scheduledPayment.update({
    where: { id: paymentId },
    data: {
      ...data,
      vendor: data.vendor ?? null,
      notes: data.notes ?? null,
      endDate: data.endDate ?? null,
    },
  });

  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/scheduled");
  return { error: undefined };
}

export async function deleteScheduledPaymentAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db.scheduledPayment.delete({ where: { id } });

  await recordActivity({
    action: "scheduled_payment.delete",
    entityType: "scheduled_payment",
    entityId: id,
  });

  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/scheduled");
}

export async function toggleScheduledPaymentAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const current = await db.scheduledPayment.findUnique({ where: { id } });
  if (!current) return;

  await db.scheduledPayment.update({
    where: { id },
    data: { active: !current.active },
  });

  revalidatePath("/admin/finance");
  revalidatePath("/admin/finance/scheduled");
}
