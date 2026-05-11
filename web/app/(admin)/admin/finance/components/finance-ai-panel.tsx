"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Clock,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  Wrench,
  ZapOff,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartBlock } from "@/components/chat/chart-block";
import { MarkdownText } from "@/components/chat/markdown";
import { cn } from "@/lib/cn";

type Props = {
  periodLabel: string;
  revenueNetMinor: number;
  expenseTotalMinor: number;
  netProfitMinor: number;
  byCategory: Array<{ category: string; amount: number; count: number }>;
  goalTargetMinor: number | null;
  goalProgressPct: number | null;
};

type Finding = {
  title: string;
  severity: "high" | "medium" | "low";
  detail: string;
};

type Action = {
  title: string;
  description: string;
  category: "CUT" | "GROW" | "FIX";
  impact_minor_monthly: number;
  urgency: "high" | "medium" | "low";
};

type InsightChart = {
  type: "bar" | "line";
  title: string;
  labels: string[];
  values: number[];
  unit: "₺" | "adet" | "%";
};

type Insight = {
  summary: string;
  key_findings: Finding[];
  actions: Action[];
  charts: InsightChart[];
};

const CACHE_KEY = "commerceos:finance-insight-v2";
type Cached = { ts: number; periodLabel: string; insight: Insight };

// Eski v1 cache (sadece text içeriyordu) varsa temizle
function clearLegacyCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("commerceos:finance-ai-insight-v1");
  } catch {}
}

function fmtTry(minor: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

const SEVERITY_META: Record<
  Finding["severity"],
  { tone: string; Icon: typeof AlertOctagon; label: string }
> = {
  high: {
    tone: "border-red-500/40 bg-red-500/[0.05] text-red-600 dark:text-red-400",
    Icon: AlertOctagon,
    label: "Yüksek risk",
  },
  medium: {
    tone: "border-amber-500/40 bg-amber-500/[0.05] text-amber-700 dark:text-amber-400",
    Icon: AlertTriangle,
    label: "Dikkat",
  },
  low: {
    tone: "border-indigo-500/40 bg-indigo-500/[0.04] text-indigo-700 dark:text-indigo-400",
    Icon: Info,
    label: "Bilgi",
  },
};

const ACTION_CATEGORY_META: Record<
  Action["category"],
  { label: string; Icon: typeof ZapOff; tone: string }
> = {
  CUT: {
    label: "Kesinti",
    Icon: ZapOff,
    tone: "bg-red-500/10 text-red-500",
  },
  GROW: {
    label: "Gelir",
    Icon: ArrowUp,
    tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FIX: {
    label: "Düzelt",
    Icon: Wrench,
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
  },
};

const URGENCY_META: Record<Action["urgency"], string> = {
  high: "border-red-500/30 bg-red-500/[0.03]",
  medium: "border-amber-500/30 bg-amber-500/[0.03]",
  low: "border-[color:var(--color-border)] bg-[color:var(--color-bg)]",
};

export function FinanceAiPanel(props: Props) {
  const [pending, start] = useTransition();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [cachedPeriod, setCachedPeriod] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mount'ta cache oku — TurnaroundPanel / CashflowForecast ile aynı pattern.
  // Period değişse bile cache'i göster ki "üretildi" durumu kaybolmasın;
  // dönem fark varsa hint olarak göster.
  useEffect(() => {
    clearLegacyCache();
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: Cached = JSON.parse(raw);
        if (parsed.insight) {
          setInsight(parsed.insight);
          setGeneratedAt(parsed.ts);
          setCachedPeriod(parsed.periodLabel);
        }
      }
    } catch {}
  }, []);

  function fetchInsight() {
    setError(null);
    start(async () => {
      try {
        const r = await fetch("/api/ai/finance-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            period_label: props.periodLabel,
            revenue_net_minor: props.revenueNetMinor,
            expense_total_minor: props.expenseTotalMinor,
            net_profit_minor: props.netProfitMinor,
            by_category: props.byCategory,
            goal_target_minor: props.goalTargetMinor,
            goal_progress_pct: props.goalProgressPct,
          }),
        });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          setError(t || `Hata ${r.status}`);
          return;
        }
        const data = (await r.json()) as Insight;
        const ts = Date.now();
        setInsight(data);
        setGeneratedAt(ts);
        setCachedPeriod(props.periodLabel);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({
              ts,
              periodLabel: props.periodLabel,
              insight: data,
            } as Cached),
          );
        } catch {}
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bağlantı hatası");
      }
    });
  }

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] to-indigo-500/[0.02]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-500" />
              Finansal İçgörü
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                AI
              </span>
            </CardTitle>
            <CardDescription>
              Risk teşhisi + somut aksiyon + grafiksel kanıt.
            </CardDescription>
            {generatedAt && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 text-[10px] text-[color:var(--color-muted)]">
                  <Clock className="h-2.5 w-2.5" />
                  {new Date(generatedAt).toLocaleString("tr-TR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {cachedPeriod && cachedPeriod !== props.periodLabel && (
                  <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {cachedPeriod} için üretildi · şu an {props.periodLabel}
                  </div>
                )}
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={fetchInsight}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Analiz ediliyor…
              </>
            ) : insight ? (
              <>
                <RefreshCw className="h-3.5 w-3.5" />
                Yenile
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                İçgörü üret
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!insight && !pending && !error && (
          <div className="py-6 text-center text-xs text-[color:var(--color-muted)]">
            <strong>İçgörü üret</strong> butonuna bas — AI verileri analiz edip
            (~10-15 sn) risk teşhisi + grafik + aksiyon listesi üretir.
          </div>
        )}

        {insight && <InsightBody insight={insight} />}
      </CardContent>
    </Card>
  );
}

function InsightBody({ insight }: { insight: Insight }) {
  return (
    <div className="space-y-5">
      {/* Summary */}
      {insight.summary && (
        <div className="rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/[0.04] p-4">
          <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
            <Sparkles className="h-3 w-3" />
            Teşhis
          </div>
          <div className="text-sm leading-relaxed">
            <MarkdownText text={insight.summary} />
          </div>
        </div>
      )}

      {/* Key findings */}
      {insight.key_findings.length > 0 && (
        <div>
          <SectionLabel icon={<AlertTriangle className="h-3 w-3" />}>
            Bulgular ({insight.key_findings.length})
          </SectionLabel>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {insight.key_findings.map((f, i) => {
              const meta = SEVERITY_META[f.severity] ?? SEVERITY_META.low;
              const Icon = meta.Icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3",
                    meta.tone,
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Icon className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold leading-tight">
                          {f.title}
                        </h4>
                        <span className="shrink-0 rounded-full bg-[color:var(--color-bg)]/60 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider opacity-75">
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                        {f.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      {insight.charts.length > 0 && (
        <div>
          <SectionLabel icon={<Target className="h-3 w-3" />}>
            Grafikler ({insight.charts.length})
          </SectionLabel>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {insight.charts.map((c, i) => (
              <ChartBlock key={i} chart={c} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      {insight.actions.length > 0 && (
        <div>
          <SectionLabel icon={<ArrowDown className="h-3 w-3" />}>
            Aksiyon planı ({insight.actions.length})
          </SectionLabel>
          <div className="space-y-2">
            {insight.actions.map((a, i) => {
              const cat = ACTION_CATEGORY_META[a.category] ?? ACTION_CATEGORY_META.FIX;
              const CatIcon = cat.Icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg border p-3",
                    URGENCY_META[a.urgency] ?? URGENCY_META.medium,
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-md",
                        cat.tone,
                      )}
                    >
                      <CatIcon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="text-sm font-semibold leading-tight">
                          {a.title}
                        </h4>
                        <div className="shrink-0 text-right">
                          <div className="font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                            +{fmtTry(a.impact_minor_monthly)} /ay
                          </div>
                          <div className="mt-0.5 flex items-center justify-end gap-1 text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                            <span className="rounded-full bg-[color:var(--color-fg)]/[0.06] px-1.5 py-0.5">
                              {a.urgency}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
                        {a.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionLabel({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
      {icon}
      {children}
    </div>
  );
}
