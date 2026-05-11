"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/permissions";
import {
  discountCreateSchema,
  discountUpdateSchema,
} from "@/lib/schemas/discounts";

export type DiscountActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  return requireRole("MANAGER");
}

export async function createDiscountAction(
  _prev: DiscountActionState,
  formData: FormData
): Promise<DiscountActionState> {
  await requireSession();

  const type = formData.get("type");
  const parsed = discountCreateSchema.safeParse({
    code: formData.get("code"),
    description: formData.get("description") || null,
    type,
    percentValue: type === "PERCENTAGE" ? formData.get("percentValue") : undefined,
    fixedValue: type === "FIXED" ? formData.get("fixedValue") : undefined,
    minSubtotal: formData.get("minSubtotal") || 0,
    maxRedemptions: formData.get("maxRedemptions") || "",
    startsAt: formData.get("startsAt") || null,
    endsAt: formData.get("endsAt") || null,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const value =
    data.type === "PERCENTAGE" ? data.percentValue ?? 0 : data.fixedValue ?? 0;

  try {
    await db.discount.create({
      data: {
        code: data.code,
        description: data.description ?? null,
        type: data.type,
        value,
        minSubtotal: data.minSubtotal ?? 0,
        maxRedemptions: data.maxRedemptions,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        isActive: data.isActive,
      },
    });

    revalidatePath("/admin/discounts");
    redirect("/admin/discounts");
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { fieldErrors: { code: ["Bu kod zaten kullanılıyor."] } };
    }
    throw err;
  }
}

export async function updateDiscountAction(
  _prev: DiscountActionState,
  formData: FormData
): Promise<DiscountActionState> {
  await requireSession();

  const id = formData.get("id");
  if (typeof id !== "string") return { error: "Geçersiz indirim." };

  const type = formData.get("type");
  const parsed = discountUpdateSchema.safeParse({
    id,
    description: formData.get("description") || null,
    type,
    percentValue: type === "PERCENTAGE" ? formData.get("percentValue") : undefined,
    fixedValue: type === "FIXED" ? formData.get("fixedValue") : undefined,
    minSubtotal: formData.get("minSubtotal") || 0,
    maxRedemptions: formData.get("maxRedemptions") || "",
    startsAt: formData.get("startsAt") || null,
    endsAt: formData.get("endsAt") || null,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const value =
    data.type === "PERCENTAGE" ? data.percentValue ?? 0 : data.fixedValue ?? 0;

  await db.discount.update({
    where: { id: data.id },
    data: {
      description: data.description ?? null,
      type: data.type,
      value,
      minSubtotal: data.minSubtotal ?? 0,
      maxRedemptions: data.maxRedemptions,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
    },
  });

  revalidatePath("/admin/discounts");
  revalidatePath(`/admin/discounts/${data.id}`);
  return { error: undefined };
}

export async function toggleDiscountAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const current = await db.discount.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!current) return;

  await db.discount.update({
    where: { id },
    data: { isActive: !current.isActive },
  });
  revalidatePath("/admin/discounts");
}

export async function deleteDiscountAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  await db.discount.delete({ where: { id } });
  revalidatePath("/admin/discounts");
}
