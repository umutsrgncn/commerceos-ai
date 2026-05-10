"use server";

import { auth } from "@/auth";
import { getReviewById, listReviewsForProduct } from "@/lib/queries/reviews";
import { getSettings } from "@/lib/queries/settings";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export type AnalyzeResult =
  | {
      ok: true;
      overall: string;
      score: number;
      positives: string;
      negatives: string;
      repeated_complaint: string;
      action: string;
    }
  | { ok: false; error: string };

export type ReplyResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function suggestReplyAction(reviewId: string): Promise<ReplyResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  const review = await getReviewById(reviewId);
  if (!review) return { ok: false, error: "Yorum bulunamadı." };

  const settings = await getSettings();

  try {
    const res = await fetch(`${AI_BASE}/reviews/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rating: review.rating,
        body: review.body,
        author_name: review.authorName,
        product_name: review.product.name,
        company_name: settings.companyName,
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `AI servisi ${res.status} döndü.` };
    }
    const data = (await res.json()) as { text: string };
    return { ok: true, text: data.text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata.",
    };
  }
}

export async function analyzeReviewsAction(
  productId: string
): Promise<AnalyzeResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  const reviews = await listReviewsForProduct(productId, 100);
  if (reviews.length === 0) {
    return { ok: false, error: "Analiz için en az 1 yorum gerekli." };
  }

  try {
    const res = await fetch(`${AI_BASE}/reviews/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviews: reviews.map((r) => ({
          rating: r.rating,
          body: r.body,
          author_name: r.authorName,
          created_at: r.createdAt.toISOString(),
        })),
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
