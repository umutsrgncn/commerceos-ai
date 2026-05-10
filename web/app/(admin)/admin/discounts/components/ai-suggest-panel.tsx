"use client";

import { useState } from "react";
import { Loader2, Snowflake, Sparkles, Sun, TrendingUp, Users, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  suggestDiscountAction,
  type DiscountSuggestResult,
} from "@/lib/actions/finance-ai";
import { cn } from "@/lib/cn";

type Intent = "boost_sales" | "clear_inventory" | "loyalty" | "new_customer";
type Season = "normal" | "summer" | "winter" | "ramadan" | "back_to_school";

const INTENT_OPTIONS: Array<{ value: Intent; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { value: "boost_sales", label: "Ciroyu canlandır", icon: TrendingUp },
  { value: "clear_inventory", label: "Stoğu erit", icon: Wand2 },
  { value: "loyalty", label: "Sadakat", icon: Users },
  { value: "new_customer", label: "Yeni müşteri", icon: Sparkles },
];

const SEASON_OPTIONS: Array<{ value: Season; label: string; icon?: React.ComponentType<{ className?: string }> }> = [
  { value: "normal", label: "Normal" },
  { value: "summer", label: "Yaz", icon: Sun },
  { value: "winter", label: "Kış", icon: Snowflake },
  { value: "ramadan", label: "Ramazan" },
  { value: "back_to_school", label: "Okul açılışı" },
];

export function DiscountAiSuggestPanel({
  onApply,
}: {
  onApply: (suggestion: {
    code: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minSubtotalMinor: number;
    days: number;
    description: string;
  }) => void;
}) {
  const [intent, setIntent] = useState<Intent>("boost_sales");
  const [season, setSeason] = useState<Season>("normal");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<DiscountSuggestResult | null>(null);

  async function ask() {
    setPending(true);
    setResult(null);
    const res = await suggestDiscountAction(intent, season);
    setPending(false);
    setResult(res);
  }

  function apply() {
    if (!result || !result.ok) return;
    onApply({
      code: result.code,
      type: result.type,
      value: result.value,
      minSubtotalMinor: result.min_subtotal,
      days: result.days,
      description: result.description,
    });
  }

  return (
    <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.04] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div>
          <div className="text-sm font-semibold">AI ile indirim öner</div>
          <div className="text-xs text-[color:var(--color-muted)]">
            Niyet + sezon seç, Gemini geçmiş verilerine bakıp kod, oran ve süre önerir
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
            Niyet
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {INTENT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = intent === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setIntent(opt.value)}
                  disabled={pending}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition",
                    active
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.06]"
                      : "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
            Sezon
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
            {SEASON_OPTIONS.map((opt) => {
              const active = season === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeason(opt.value)}
                  disabled={pending}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs transition",
                    active
                      ? "bg-[color:var(--color-fg)]/[0.08] font-medium text-[color:var(--color-fg)]"
                      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          type="button"
          size="sm"
          onClick={ask}
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Analiz ediliyor...
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              {result?.ok ? "Tekrar öner" : "İndirim öner"}
            </>
          )}
        </Button>

        {result && !result.ok && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-xs text-red-500">
            {result.error}
          </div>
        )}

        {result && result.ok && (
          <div className="space-y-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base font-semibold">{result.code}</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                {result.type === "PERCENTAGE"
                  ? `%${result.value} indirim`
                  : `${(result.value / 100).toFixed(0)} ₺ indirim`}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[color:var(--color-muted)]">
              <span>Süre</span>
              <span className="text-right text-[color:var(--color-fg)]">
                {result.days} gün
              </span>
              {result.min_subtotal > 0 && (
                <>
                  <span>Min sepet</span>
                  <span className="text-right text-[color:var(--color-fg)] font-mono">
                    {(result.min_subtotal / 100).toFixed(0)} ₺
                  </span>
                </>
              )}
            </div>
            {result.description && (
              <p className="border-t border-[color:var(--color-border)] pt-2 text-[color:var(--color-muted)]">
                {result.description}
              </p>
            )}
            {result.reasoning && (
              <p className="text-[10px] italic text-[color:var(--color-muted)]">
                {result.reasoning}
              </p>
            )}
            <Button
              type="button"
              size="sm"
              onClick={apply}
              className="w-full"
            >
              Bu öneriyi forma uygula
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
