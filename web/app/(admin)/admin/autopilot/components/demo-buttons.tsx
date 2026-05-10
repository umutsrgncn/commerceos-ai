"use client";

import { useState, useTransition } from "react";
import {
  CheckCircle2,
  Loader2,
  MessageSquare,
  Package,
  Receipt,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  demoConfirmOrderAction,
  demoNewReviewAction,
  demoStockDropAction,
  type DemoResult,
} from "@/lib/actions/autopilot-demo";

type Sim = "review" | "order" | "stock";

const META: Record<
  Sim,
  { label: string; description: string; icon: React.ComponentType<{ className?: string }> }
> = {
  review: {
    label: "Yeni yorum gönder",
    description:
      "Rastgele bir ürüne demo yorum ekler — Otopilot AI ile cevap yazıp yayınlar.",
    icon: MessageSquare,
  },
  order: {
    label: "Sipariş onayla",
    description:
      "PENDING bir siparişi CONFIRMED'a alır — Otopilot e-fatura/e-arşiv keser.",
    icon: Receipt,
  },
  stock: {
    label: "Stok düşür",
    description:
      "Tedarikçide SKU'su olan bir ürünün stoğunu 3'e düşürür — Otopilot AI mail yazıp tedarikçiye sipariş geçer.",
    icon: Package,
  },
};

export function DemoButtons({ enabled }: { enabled: boolean }) {
  const [pending, start] = useTransition();
  const [activeSim, setActiveSim] = useState<Sim | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  function run(sim: Sim) {
    setActiveSim(sim);
    setFeedback(null);
    start(async () => {
      let r: DemoResult;
      if (sim === "review") r = await demoNewReviewAction();
      else if (sim === "order") r = await demoConfirmOrderAction();
      else r = await demoStockDropAction();

      setFeedback(
        r.ok
          ? { ok: true, message: r.message }
          : { ok: false, message: r.error },
      );
      setActiveSim(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(["review", "order", "stock"] as Sim[]).map((sim) => {
          const meta = META[sim];
          const Icon = meta.icon;
          const busy = activeSim === sim && pending;
          return (
            <button
              key={sim}
              type="button"
              onClick={() => run(sim)}
              disabled={!enabled || pending}
              className="group flex flex-col items-start gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-left transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-fuchsia-500/10 text-fuchsia-600 group-hover:bg-fuchsia-500/15">
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </span>
              <div className="text-sm font-medium">{meta.label}</div>
              <p className="text-[10px] text-[color:var(--color-muted)]">
                {meta.description}
              </p>
            </button>
          );
        })}
      </div>

      {!enabled && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/[0.04] p-2 text-xs text-amber-700 dark:text-amber-400">
          Otopilot kapalı. Önce <strong>Ayarlar &gt; Otopilot Modu</strong>'nu
          aktif et.
        </p>
      )}

      {feedback && (
        <div
          className={
            "flex items-start gap-2 rounded-md border p-3 text-sm " +
            (feedback.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-500/10 text-red-500")
          }
        >
          {feedback.ok && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
