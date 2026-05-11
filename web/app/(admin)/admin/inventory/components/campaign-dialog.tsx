"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wand2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  applyCampaignSuggestionAction,
  suggestDeadStockCampaignAction,
  type CampaignSuggestion,
  type SuggestCampaignResult,
} from "@/lib/actions/campaigns";
import { cn } from "@/lib/cn";

function formatTry(minor: number | null | undefined): string {
  if (minor == null) return "—";
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

type Props = {
  productId: string;
  productName: string;
  hasCostPrice: boolean;
  trigger?: React.ReactNode;
};

export function CampaignDialog({
  productId,
  productName,
  hasCostPrice,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<SuggestCampaignResult | null>(null);
  const [applied, setApplied] = useState<{
    code: string;
    discountId: string;
  } | null>(null);
  const [overrideCode, setOverrideCode] = useState<string>("");
  const [overridePct, setOverridePct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setOpen(true);
    setApplied(null);
    setError(null);
    if (!result || !result.ok) suggest();
  }

  function suggest() {
    setError(null);
    start(async () => {
      const r = await suggestDeadStockCampaignAction(productId);
      setResult(r);
      if (r.ok) {
        setOverrideCode(r.suggestedCode);
        setOverridePct(r.suggestedDiscountPct);
      } else {
        setError(r.error);
      }
    });
  }

  function apply() {
    if (!result || !result.ok) return;
    const code = overrideCode.trim().toUpperCase();
    const pct = overridePct ?? result.suggestedDiscountPct;
    if (!code || code.length < 3) {
      setError("Kod en az 3 karakter olmalı");
      return;
    }
    setError(null);

    const description =
      result.messaging ??
      `${productName} kampanyası — %${pct} indirim`;

    start(async () => {
      const r = await applyCampaignSuggestionAction({
        productId,
        productName,
        code,
        discountPct: pct,
        durationDays: result.durationDays,
        minSubtotalMinor: result.minSubtotalMinor,
        description,
      });
      if (!r.ok) setError(r.error ?? "Hata");
      else setApplied({ code, discountId: r.discountId ?? "" });
    });
  }

  return (
    <>
      <span onClick={hasCostPrice ? openDialog : undefined}>
        {trigger ?? (
          <Button
            type="button"
            size="sm"
            disabled={!hasCostPrice}
            title={
              hasCostPrice
                ? "AI ile kampanya öner"
                : "Önce maliyet (costPrice) gir"
            }
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Analiz
          </Button>
        )}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-xl border border-fuchsia-500/30 bg-[color:var(--color-bg)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-5 py-3 bg-gradient-to-r from-fuchsia-500/[0.06] to-indigo-500/[0.04]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-500" />
                <div>
                  <h2 className="text-sm font-semibold">
                    AI Kampanya Önerisi
                  </h2>
                  <p className="text-[10px] text-[color:var(--color-muted)]">
                    {productName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 hover:bg-[color:var(--color-fg)]/[0.06]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="max-h-[70vh] themed-scroll overflow-y-auto p-5 space-y-4">
              {pending && !result && (
                <div className="flex items-center gap-2 py-6 text-sm text-[color:var(--color-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin text-fuchsia-500" />
                  AI ürün hareketsizliğini ve marj senaryosunu analiz ediyor...
                </div>
              )}

              {error && !applied && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                  {error}
                </div>
              )}

              {result && !result.ok && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.04] p-3 text-sm">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <div className="font-medium text-amber-700 dark:text-amber-400">
                        Öneri üretilemedi
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                        {result.error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result && result.ok && !applied && (
                <CampaignBody
                  s={result}
                  overrideCode={overrideCode}
                  setOverrideCode={setOverrideCode}
                  overridePct={overridePct ?? result.suggestedDiscountPct}
                  setOverridePct={setOverridePct}
                />
              )}

              {applied && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>
                      Kampanya başlatıldı! Kodu paylaşmaya hazır:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/[0.06] p-4">
                    <code className="flex-1 font-mono text-lg font-bold tracking-wider">
                      {applied.code}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(applied.code);
                      }}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Kopyala
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-5 py-3">
              {!applied && result && result.ok && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={suggest}
                  disabled={pending}
                  type="button"
                >
                  {pending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="h-3.5 w-3.5" />
                  )}
                  Yeniden öner
                </Button>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Kapat
                </Button>
                {result && result.ok && !applied && (
                  <Button
                    size="sm"
                    onClick={apply}
                    disabled={pending}
                    type="button"
                  >
                    {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Kampanyayı başlat
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function CampaignBody({
  s,
  overrideCode,
  setOverrideCode,
  overridePct,
  setOverridePct,
}: {
  s: CampaignSuggestion;
  overrideCode: string;
  setOverrideCode: (v: string) => void;
  overridePct: number;
  setOverridePct: (v: number) => void;
}) {
  const newPriceMinor =
    s.currentPriceMinor > 0
      ? Math.round(s.currentPriceMinor * (100 - overridePct) / 100)
      : null;
  const newMarginAfter =
    s.costPriceMinor != null && newPriceMinor != null && newPriceMinor > 0
      ? ((newPriceMinor - s.costPriceMinor) / newPriceMinor) * 100
      : null;
  const profitPerUnit =
    s.costPriceMinor != null && newPriceMinor != null
      ? newPriceMinor - s.costPriceMinor
      : null;
  const negativeMargin = profitPerUnit != null && profitPerUnit < 0;

  return (
    <div className="space-y-4">
      {/* Bağlam: ürün durumu */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <Stat
          label="Stok"
          value={`${s.stockQuantity} adet`}
          hint={
            s.costPriceMinor != null
              ? `Bağlı: ${formatTry(s.stockQuantity * s.costPriceMinor)}`
              : ""
          }
        />
        <Stat
          label="Son 60g satış"
          value={`${s.soldLast60d} adet`}
          hint={
            s.daysSinceLastSale != null
              ? `${s.daysSinceLastSale} gün önce son`
              : "60+ gün hareketsiz"
          }
          tone={s.soldLast60d === 0 ? "warning" : "neutral"}
        />
        <Stat
          label="Mevcut fiyat"
          value={formatTry(s.currentPriceMinor)}
          hint={
            s.currentMarginPct != null
              ? `Marj %${s.currentMarginPct.toFixed(1)}`
              : "Maliyet eksik"
          }
        />
        <Stat
          label="Maliyet"
          value={formatTry(s.costPriceMinor)}
        />
      </div>

      {/* Önerilen kampanya */}
      <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/[0.04] p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
            <Sparkles className="h-3 w-3" />
            AI önerisi
          </div>
          <span className="rounded-full bg-fuchsia-500/15 px-1.5 py-0.5 text-[10px] tabular-nums text-fuchsia-700 dark:text-fuchsia-400">
            güven %{s.confidence}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Kampanya kodu
            </Label>
            <Input
              value={overrideCode}
              onChange={(e) => setOverrideCode(e.target.value.toUpperCase())}
              className="font-mono uppercase"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              İndirim oranı: %{overridePct}
            </Label>
            <input
              type="range"
              min={5}
              max={60}
              step={5}
              value={overridePct}
              onChange={(e) => setOverridePct(Number(e.target.value))}
              className="w-full accent-fuchsia-500"
            />
          </div>
        </div>

        {/* Yeni fiyat + marj kıyas */}
        <div
          className={cn(
            "rounded-md border p-2.5 text-xs",
            negativeMargin
              ? "border-red-500/40 bg-red-500/[0.05]"
              : "border-[color:var(--color-border)] bg-[color:var(--color-bg)]",
          )}
        >
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-[10px] uppercase text-[color:var(--color-muted)]">
                Yeni fiyat
              </div>
              <div className="font-semibold tabular-nums">
                {formatTry(newPriceMinor)}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[color:var(--color-muted)]">
                Yeni marj
              </div>
              <div
                className={cn(
                  "font-semibold tabular-nums",
                  newMarginAfter != null && newMarginAfter < 10
                    ? "text-amber-600"
                    : "",
                  negativeMargin ? "text-red-500" : "",
                )}
              >
                {newMarginAfter != null
                  ? `%${newMarginAfter.toFixed(1)}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[color:var(--color-muted)]">
                Adet başı kâr
              </div>
              <div
                className={cn(
                  "font-semibold tabular-nums",
                  negativeMargin ? "text-red-500" : "text-emerald-600",
                )}
              >
                {formatTry(profitPerUnit)}
              </div>
            </div>
          </div>
          {negativeMargin && (
            <div className="mt-2 flex items-start gap-1.5 text-[10px] text-red-500">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span>
                Bu indirimle adet başı zarar edersin! Maliyetin altına düşme.
              </span>
            </div>
          )}
        </div>

        {/* Süre + hedef */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[color:var(--color-muted)]">Süre: </span>
            <span className="font-medium">{s.durationDays} gün</span>
          </div>
          {s.targetAudience && (
            <div>
              <span className="text-[color:var(--color-muted)]">Hedef: </span>
              <span className="font-medium">{s.targetAudience}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reasoning + outcome */}
      {s.messaging && (
        <div className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mb-1">
            Müşteriye mesaj
          </div>
          <p className="text-sm italic">"{s.messaging}"</p>
        </div>
      )}

      {s.reasoning && (
        <div>
          <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)] mb-1">
            AI gerekçesi
          </div>
          <p className="text-xs">{s.reasoning}</p>
        </div>
      )}

      {s.expectedOutcome && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/[0.03] p-2.5 text-xs">
          <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <div>
            <div className="font-medium text-emerald-700 dark:text-emerald-400">
              Beklenen sonuç
            </div>
            <p className="text-[color:var(--color-muted)]">{s.expectedOutcome}</p>
          </div>
        </div>
      )}

      {s.riskWarning && (
        <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/[0.04] p-2.5 text-xs">
          <TrendingDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <div>
            <div className="font-medium text-amber-700 dark:text-amber-400">
              Risk uyarısı
            </div>
            <p className="text-[color:var(--color-muted)]">{s.riskWarning}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "warning" | "danger";
}) {
  const toneClass =
    tone === "warning"
      ? "border-amber-500/30 bg-amber-500/[0.04]"
      : tone === "danger"
        ? "border-red-500/30 bg-red-500/[0.04]"
        : "border-[color:var(--color-border)] bg-[color:var(--color-bg)]";
  return (
    <div className={cn("rounded-md border p-2.5", toneClass)}>
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
