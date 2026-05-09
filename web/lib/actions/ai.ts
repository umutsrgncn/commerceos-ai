"use server";

import { auth } from "@/auth";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

export type GenerateDescriptionInput = {
  name: string;
  sku?: string;
  category?: string | null;
  keywords?: string;
  tone?: "professional" | "casual" | "playful";
};

export type DraftMessageIntent =
  | "shipped"
  | "delayed"
  | "thanks"
  | "apology"
  | "cancelled";

export type DraftMessageInput = {
  intent: DraftMessageIntent;
  order_number: string;
  customer_name: string;
  total_label?: string;
  extra_context?: string;
};

export type GenerateDescriptionResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export type DraftMessageResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function draftCustomerMessage(
  input: DraftMessageInput
): Promise<DraftMessageResult> {
  const session = await auth();
  if (!session?.user) return { ok: false, error: "Yetkisiz." };

  try {
    const response = await fetch(`${AI_BASE}/messages/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });
    if (!response.ok) {
      return { ok: false, error: `AI servisi ${response.status} döndü.` };
    }
    const data = (await response.json()) as { text: string };
    return { ok: true, text: data.text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata.",
    };
  }
}

export async function generateProductDescription(
  input: GenerateDescriptionInput
): Promise<GenerateDescriptionResult> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, error: "Yetkisiz." };
  }
  if (!input.name.trim()) {
    return { ok: false, error: "Ürün adı boş olamaz." };
  }

  try {
    const response = await fetch(`${AI_BASE}/products/describe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      cache: "no-store",
    });

    if (!response.ok) {
      return { ok: false, error: `AI servisi ${response.status} döndü.` };
    }

    const data = (await response.json()) as { text: string };
    return { ok: true, text: data.text };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bilinmeyen hata.",
    };
  }
}
