import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

import { db } from "@/lib/db";
import { CampaignClient } from "./components/campaign-client";
import { SEGMENTS, type Segment } from "@/lib/email/constants";

export const metadata = { title: "E-Posta Kampanyası — CommerceOS" };

export default async function CustomerCampaignPage() {
  // Server-side initial counts (UI mount'ta direkt göster)
  const groups = await db.customer.groupBy({
    by: ["aiSegment"],
    _count: { _all: true },
  });
  const total = groups.reduce((s, g) => s + g._count._all, 0);
  const counts: Record<Segment, number> = {
    "sadık": 0,
    VIP: 0,
    yeni: 0,
    risky: 0,
    all: total,
  };
  for (const g of groups) {
    if (g.aiSegment && (SEGMENTS as readonly string[]).includes(g.aiSegment)) {
      counts[g.aiSegment as Segment] = g._count._all;
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/customers"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Müşteriler
      </Link>

      <div className="flex items-start gap-4 rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-fuchsia-500/[0.06] via-indigo-500/[0.04] to-emerald-500/[0.04] px-4 py-4 sm:px-6 sm:py-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-md">
          <Mail className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            E-posta kampanyası
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[color:var(--color-muted)]">
            Hedef segmenti seç, AI ile içerik üret, tek tıkla gönder. Mock
            SMTP — gerçek email servisi (SendGrid/Mailgun) bağlandığında bu
            arayüz aynen çalışır, sadece backend'de SMTP transport'u
            değiştirilir.
          </p>
        </div>
      </div>

      <CampaignClient initialCounts={counts} />
    </div>
  );
}
