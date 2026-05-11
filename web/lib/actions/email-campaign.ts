"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { recordActivity } from "@/lib/activity";
import { getSettings } from "@/lib/queries/settings";
import { SEGMENTS, type Segment } from "@/lib/email/constants";

const AI_BASE = process.env.AI_SERVICE_URL ?? "http://localhost:8000";

async function requireSession() {
  const s = await auth();
  if (!s?.user) throw new Error("UNAUTHORIZED");
  return s;
}

export type DraftResult =
  | { ok: true; subject: string; body: string }
  | { ok: false; error: string };

/** AI ile email içerik taslağı üret. */
export async function draftCampaignAction(input: {
  segment: Segment;
  intent: string;
  discountCode?: string;
  discountPct?: number;
  extraContext?: string;
}): Promise<DraftResult> {
  await requireSession();
  const settings = await getSettings();

  try {
    const res = await fetch(`${AI_BASE}/customers/campaign/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        segment: input.segment,
        intent: input.intent,
        company_name: settings.companyName,
        discount_code: input.discountCode,
        discount_pct: input.discountPct,
        extra_context: input.extraContext,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `AI ${res.status}: ${t.slice(0, 100)}` };
    }
    const data = await res.json();
    return {
      ok: true,
      subject: data.subject ?? "",
      body: data.body ?? "",
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Bağlantı hatası",
    };
  }
}

export type SendResult = {
  ok: boolean;
  sent?: number;
  failed?: number;
  error?: string;
};

/** Kampanyayı seçilen segmente gönder (mock SMTP — DB'ye CustomerEmail
 *  kayıtları yazar, gerçek SMTP yok). */
export async function sendCampaignAction(input: {
  segment: Segment;
  subject: string;
  body: string;
  campaignTag?: string;
}): Promise<SendResult> {
  await requireSession();

  if (!input.subject || input.subject.length < 3) {
    return { ok: false, error: "Konu en az 3 karakter olmalı" };
  }
  if (!input.body || input.body.length < 10) {
    return { ok: false, error: "İçerik en az 10 karakter olmalı" };
  }

  // Hedef listeyi belirle
  const where =
    input.segment === "all"
      ? {}
      : { aiSegment: input.segment };

  const customers = await db.customer.findMany({
    where,
    select: { id: true, email: true, name: true },
  });

  if (customers.length === 0) {
    return {
      ok: false,
      error: `Bu segmente uygun müşteri yok (segment: ${input.segment}). Önce otopilot segmentlemeli.`,
    };
  }

  // Mock SMTP: her müşteriye bir CustomerEmail kaydı oluştur
  const tag =
    input.campaignTag ??
    `segment-${input.segment}-${Date.now().toString(36)}`;

  let sent = 0;
  for (const c of customers) {
    try {
      await db.customerEmail.create({
        data: {
          customerId: c.id,
          subject: input.subject,
          body: input.body,
          status: "SENT",
          campaignTag: tag,
          sentAt: new Date(),
        },
      });
      sent++;
    } catch {
      // ignore
    }
  }

  await recordActivity({
    action: "campaign.email_sent",
    metadata: {
      segment: input.segment,
      tag,
      sent,
      total: customers.length,
      subject: input.subject,
    },
  });

  revalidatePath("/admin/customers/campaign");
  revalidatePath("/admin/customers");

  return { ok: true, sent, failed: customers.length - sent };
}

/** Hangi segmentte kaç müşteri var — UI gösterimi için. */
export async function getSegmentCountsAction(): Promise<
  Record<Segment, number>
> {
  await requireSession();

  const groups = await db.customer.groupBy({
    by: ["aiSegment"],
    _count: { _all: true },
  });

  const counts: Record<Segment, number> = {
    "sadık": 0,
    VIP: 0,
    yeni: 0,
    risky: 0,
    all: 0,
  };
  let total = 0;
  for (const g of groups) {
    total += g._count._all;
    if (g.aiSegment && (SEGMENTS as readonly string[]).includes(g.aiSegment)) {
      counts[g.aiSegment as Segment] = g._count._all;
    }
  }
  counts.all = total;
  return counts;
}
