"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewCreateSchema } from "@/lib/schemas/reviews";
import { recordActivity } from "@/lib/activity";

export type ReviewActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
} | null;

async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session;
}

export async function replyToReviewAction(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  await requireSession();

  const id = formData.get("id");
  const reply = formData.get("reply");
  if (typeof id !== "string") return { error: "Geçersiz yorum." };
  if (typeof reply !== "string" || reply.trim().length < 5) {
    return { fieldErrors: { reply: ["Cevap en az 5 karakter."] } };
  }

  const review = await db.productReview.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!review) return { error: "Yorum bulunamadı." };

  await db.productReview.update({
    where: { id },
    data: { reply: reply.trim(), repliedAt: new Date() },
  });

  await recordActivity({
    action: "review.reply",
    entityType: "product",
    entityId: review.productId,
    metadata: { reviewId: id },
  });

  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/products/${review.productId}`);
  return { ok: true };
}

export async function clearReplyAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const review = await db.productReview.findUnique({
    where: { id },
    select: { productId: true },
  });
  if (!review) return;

  await db.productReview.update({
    where: { id },
    data: { reply: null, repliedAt: null },
  });
  revalidatePath("/admin/reviews");
  revalidatePath(`/admin/products/${review.productId}`);
}

export async function createReviewAction(
  _prev: ReviewActionState,
  formData: FormData
): Promise<ReviewActionState> {
  await requireSession();

  const parsed = reviewCreateSchema.safeParse({
    productId: formData.get("productId"),
    authorName: formData.get("authorName"),
    authorEmail: formData.get("authorEmail") ?? "",
    rating: formData.get("rating"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const created = await db.productReview.create({
    data: {
      productId: parsed.data.productId,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail ?? null,
      rating: parsed.data.rating,
      body: parsed.data.body,
    },
  });

  await recordActivity({
    action: "review.create",
    entityType: "product",
    entityId: parsed.data.productId,
    metadata: { reviewId: created.id, rating: parsed.data.rating },
  });

  // Otopilot: önce analiz et (negatif flag), sonra cevap yaz
  try {
    const { autoAnalyzeReview, autoReplyToReview } = await import(
      "@/lib/autopilot/core"
    );
    await autoAnalyzeReview(created.id);
    await autoReplyToReview(created.id);
  } catch {
    // sessizce devam — otopilot opsiyonel
  }

  revalidatePath(`/admin/products/${parsed.data.productId}`);
  return { ok: true };
}

export async function deleteReviewAction(formData: FormData) {
  await requireSession();

  const id = formData.get("id");
  const productId = formData.get("productId");
  if (typeof id !== "string" || typeof productId !== "string") return;

  await db.productReview.delete({ where: { id } });
  await recordActivity({
    action: "review.delete",
    entityType: "product",
    entityId: productId,
    metadata: { reviewId: id },
  });
  revalidatePath(`/admin/products/${productId}`);
}

export async function togglePublishReviewAction(formData: FormData) {
  await requireSession();

  const id = formData.get("id");
  const productId = formData.get("productId");
  if (typeof id !== "string" || typeof productId !== "string") return;

  const current = await db.productReview.findUnique({
    where: { id },
    select: { isPublished: true },
  });
  if (!current) return;

  await db.productReview.update({
    where: { id },
    data: { isPublished: !current.isPublished },
  });
  revalidatePath(`/admin/products/${productId}`);
}
