"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Loader2,
  Sparkles,
  TrendingUp,
  Wand2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  suggestPriceAction,
  type PriceSuggestResult,
} from "@/lib/actions/finance-ai";
import { applyPriceSuggestionAction } from "@/lib/actions/products";
import { cn } from "@/lib/cn";

function formatTry(minor: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  }).format(minor / 100);
}

export function PricingAiCard({
  productId,
  hasCostPrice,
}: {
  productId: string;
  hasCostPrice: boolean;
}) {
  const [pending, start] = useTransition();
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<PriceSuggestResult | null>(null);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function suggest() {
    setError(null);
    setApplied(false);
    start(async () => {
      const r = await suggestPriceAction(productId);
      setResult(r);
      if (!r.ok) setError(r.error);
    });
  }

  async function applyPrice() {
    if (!result || !result.ok || result.suggestedPriceMinor == null) return;
    setApplying(true);
    setError(null);
    const r = await applyPriceSuggestionAction({
      productId,
      newPriceMinor: result.suggestedPriceMinor,
    });
    setApplying(false);
    if (!r.ok) {
      setError(r.error ?? "Uygulanamadı");
      return;
    }
    setApplied(true);
  }

  if (!hasCostPrice) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/[0.04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-fuchsia-500" />
            AI Fiyat Önerisi
          </CardTitle>
          <CardDescription className="text-xs">
            Önce <strong>maliyet</strong> alanını doldur — AI marj
            hesaplayabilmek için maliyete ihtiyaç duyar.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              AI Fiyat Önerisi
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                AI
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Maliyet + son 30 gün satış hızına göre kâr maximize eden fiyat.
            </CardDescription>
          </div>
          {!result && !pending && (
            <Button type="button" size="sm" onClick={suggest}>
              <Wand2 className="h-3.5 w-3.5" />
              Öneri al
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {pending && !result && (
          <div className="flex items-center gap-2 py-3 text-xs text-[color:var(--color-muted)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-fuchsia-500" />
            AI satış pattern'ini ve marj senaryosunu analiz ediyor...
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
            {error}
          </div>
        )}

        {result && result.ok && result.suggestedPriceMinor != null && (
          <SuggestionBody
            result={result}
            applied={applied}
            applying={applying}
            onApply={applyPrice}
            onRefresh={suggest}
            refreshing={pending}
          />
        )}

        {result && result.ok && result.suggestedPriceMinor == null && (
          <div className="text-xs text-[color:var(--color-muted)]">
            AI yeterli veri bulamadı — birkaç satış sonra tekrar dene.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionBody({
  result,
  applied,
  applying,
  onApply,
  onRefresh,
  refreshing,
}: {
  result: Extract<PriceSuggestResult, { ok: true }>;
  applied: boolean;
  applying: boolean;
  onApply: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const action = result.action;
  const ActionIcon =
    action === "increase"
      ? ArrowUpRight
      : action === "decrease"
        ? ArrowDownRight
        : ArrowRight;
  const actionTone =
    action === "increase"
      ? "text-emerald-600"
      : action === "decrease"
        ? "text-amber-600"
        : "text-[color:var(--color-muted)]";

  const priceDelta =
    result.suggestedPriceMinor! - result.currentPriceMinor;
  const priceDeltaPct =
    result.currentPriceMinor > 0
      ? (priceDelta / result.currentPriceMinor) * 100
      : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <PriceTile
          label="Mevcut"
          value={formatTry(result.currentPriceMinor)}
          hint={
            result.currentMarginPct != null
              ? `Marj %${result.currentMarginPct.toFixed(1)}`
              : ""
          }
        />
        <PriceTile
          label="AI önerisi"
          value={formatTry(result.suggestedPriceMinor!)}
          hint={
            result.suggestedMarginPct != null
              ? `Marj %${result.suggestedMarginPct.toFixed(1)}`
              : ""
          }
          highlight
        />
        <PriceTile
          label="Fiyat değişimi"
          value={`${priceDeltaPct > 0 ? "+" : ""}${priceDeltaPct.toFixed(1)}%`}
          hint={`${priceDelta > 0 ? "+" : ""}${formatTry(priceDelta)}`}
        />
        <PriceTile
          label="Beklenen kâr etkisi"
          value={
            result.expectedProfitChangePct != null
              ? `${result.expectedProfitChangePct > 0 ? "+" : ""}${result.expectedProfitChangePct.toFixed(1)}%`
              : "—"
          }
          hint={
            result.expectedSalesChangePct != null
              ? `Satış: ${result.expectedSalesChangePct > 0 ? "+" : ""}${result.expectedSalesChangePct.toFixed(1)}%`
              : ""
          }
        />
      </div>

      <div className="flex items-center gap-2 text-xs">
        <ActionIcon className={cn("h-4 w-4", actionTone)} />
        <span className="font-medium capitalize">
          {action === "increase"
            ? "Fiyat artışı önerisi"
            : action === "decrease"
              ? "Fiyat düşüşü önerisi"
              : "Fiyat sabit kalsın"}
        </span>
        <ConfidenceBadge value={result.confidence} />
        <span className="text-[color:var(--color-muted)]">
          · son 30g {result.sales30d} adet satış
        </span>
      </div>

      {result.reasoning && (
        <p className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-3 text-xs">
          {result.reasoning}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {applied ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
            <Check className="h-3.5 w-3.5" />
            Yeni fiyat uygulandı
          </span>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={onApply}
            disabled={applying || action === "hold"}
          >
            {applying ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uygulanıyor...
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5" />
                Bu fiyatı uygula
              </>
            )}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wand2 className="h-3.5 w-3.5" />
          )}
          Tekrar öner
        </Button>
      </div>
    </div>
  );
}

function PriceTile({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-2.5",
        highlight
          ? "border-fuchsia-500/40 bg-fuchsia-500/[0.05]"
          : "border-[color:var(--color-border)] bg-[color:var(--color-bg)]",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums">{value}</div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
          {hint}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const tone =
    value >= 70
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
      : value >= 40
        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
        : "bg-red-500/15 text-red-600 dark:text-red-400";
  return (
    <span
      className={cn(
        "rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums",
        tone,
      )}
    >
      güven %{value}
    </span>
  );
}
