"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  Package,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/lib/actions/settings";
import { cn } from "@/lib/cn";

const STEPS = [
  {
    id: "welcome",
    icon: Sparkles,
    title: "CommerceOS AI'ya hoş geldin",
    description:
      "AI ile yönetilen e-ticaret panelin. Bu kısa tur ile temel akışı 1 dakikada öğreneceksin.",
    cta: "Başla",
  },
  {
    id: "company",
    icon: Building2,
    title: "Şirket bilgilerini gir",
    description:
      "Vergi numaran ve şirket adı GİB e-faturada görünür. Ayarlar sayfasından şimdi doldur.",
    cta: "Ayarlara git",
    href: "/admin/settings",
  },
  {
    id: "products",
    icon: Package,
    title: "İlk ürününü ekle",
    description:
      "Ad, fiyat, maliyet (önemli — AI kâr önerileri için) gir. AI ile açıklama da üretebilirsin.",
    cta: "Ürün ekle",
    href: "/admin/products/new",
  },
  {
    id: "autopilot",
    icon: Sparkles,
    title: "Otopilot'u tanı",
    description:
      "AI yorumlara cevap yazsın, e-faturayı kessin, stok düşünce tedarikçiye sipariş atsın. Sağ alt köşede sürekli AI'nın aldığı kararları izleyebilirsin.",
    cta: "Otopilot panelini aç",
    href: "/admin/autopilot",
  },
] as const;

export function OnboardingWizard() {
  const [open, setOpen] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [pending, start] = useTransition();

  function next() {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      finish();
    }
  }

  function finish() {
    start(async () => {
      await completeOnboardingAction();
      setOpen(false);
    });
  }

  function skip() {
    finish();
  }

  if (!open) return null;

  const step = STEPS[stepIdx];
  const Icon = step.icon;
  const isLast = stepIdx === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-fuchsia-500/30 bg-[color:var(--color-bg)] shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Top gradient stripe */}
        <div className="h-1.5 w-full rounded-t-2xl bg-gradient-to-r from-fuchsia-500 via-indigo-500 to-emerald-500" />

        <button
          type="button"
          onClick={skip}
          className="absolute right-3 top-3 rounded-full p-1.5 text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.06]"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="px-6 pb-6 pt-8">
          {/* Step icon */}
          <div className="flex justify-center pb-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white shadow-lg shadow-fuchsia-500/30">
              <Icon className="h-8 w-8" />
            </span>
          </div>

          <h2 className="text-center text-xl font-semibold tracking-tight">
            {step.title}
          </h2>
          <p className="mt-2 text-center text-sm text-[color:var(--color-muted)]">
            {step.description}
          </p>

          {/* Progress dots */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIdx
                    ? "w-8 bg-gradient-to-r from-fuchsia-500 to-indigo-500"
                    : i < stepIdx
                      ? "w-2 bg-fuchsia-500/60"
                      : "w-2 bg-[color:var(--color-fg)]/15",
                )}
              />
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-5 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={skip}
              disabled={pending}
            >
              Bu turu atla
            </Button>
            <div className="flex items-center gap-2">
              {"href" in step && step.href ? (
                <Link href={step.href as string}>
                  <Button type="button" size="sm" variant="outline">
                    {step.cta}
                  </Button>
                </Link>
              ) : null}
              <Button
                type="button"
                size="sm"
                onClick={next}
                disabled={pending}
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isLast ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Tamam
                  </>
                ) : (
                  <>
                    Sonraki
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
