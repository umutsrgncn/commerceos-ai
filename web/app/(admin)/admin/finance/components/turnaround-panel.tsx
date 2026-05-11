"use client";

import { useEffect, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  Hammer,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wrench,
  ZapOff,
  Megaphone,
  Handshake,
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
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { cn } from "@/lib/cn";

type CategoryBar = {
  category: string;
  amount_minor: number;
  pct: number;
};

type Monthly = {
  month_label: string;
  revenue_minor: number;
  expense_minor: number;
  scheduled_minor: number;
  balance_minor: number;
  balance_with_plan_minor: number;
};

type Action = {
  title: string;
  description: string;
  category: string;
  impact_minor_monthly: number;
  urgency: "high" | "medium" | "low";
  week: number | null;
};

type Plan = {
  severity: "critical" | "warning" | "ok";
  summary: string;
  current_balance_minor: number;
  projected_90day_balance_minor: number;
  projected_with_plan_minor: number;
  category_bars: CategoryBar[];
  monthly: Monthly[];
  actions: Action[];
};

const CACHE_KEY = "commerceos:finance-turnaround-v1";
type Cached = { ts: number; plan: Plan };

function fmtTry(minor: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

const ACTION_CATEGORY_META: Record<
  string,
  { label: string; tone: string; Icon: typeof Hammer }
> = {
  CUT: { label: "Kesinti", tone: "text-red-500 bg-red-500/10", Icon: ZapOff },
  BOOST: { label: "Gelir", tone: "text-emerald-500 bg-emerald-500/10", Icon: TrendingUp },
  DELAY: { label: "Ertele", tone: "text-amber-600 bg-amber-500/10", Icon: Clock },
  RENEGOTIATE: { label: "Pazarlık", tone: "text-indigo-500 bg-indigo-500/10", Icon: Handshake },
  MARKETING: { label: "Reklam", tone: "text-fuchsia-500 bg-fuchsia-500/10", Icon: Megaphone },
  OTHER: { label: "Diğer", tone: "text-[color:var(--color-muted)] bg-[color:var(--color-fg)]/[0.06]", Icon: Wrench },
};

const URGENCY_META: Record<string, string> = {
  high: "border-red-500/40 bg-red-500/[0.04] text-red-600",
  medium: "border-amber-500/40 bg-amber-500/[0.04] text-amber-700 dark:text-amber-400",
  low: "border-indigo-500/40 bg-indigo-500/[0.04] text-indigo-600 dark:text-indigo-400",
};

const SEVERITY_BANNER: Record<
  Plan["severity"],
  { tone: string; title: string; Icon: typeof AlertTriangle }
> = {
  critical: {
    tone: "border-red-500/40 bg-red-500/[0.06] text-red-600",
    title: "Kritik — bakiye 90 gün içinde eksiye düşüyor",
    Icon: AlertTriangle,
  },
  warning: {
    tone: "border-amber-500/40 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400",
    title: "Uyarı — bakiye risk altında, plan gerekli",
    Icon: AlertTriangle,
  },
  ok: {
    tone: "border-emerald-500/40 bg-emerald-500/[0.06] text-emerald-700 dark:text-emerald-400",
    title: "İyi — bakiye seyri güvende, küçük iyileştirme önerileri",
    Icon: Sparkles,
  },
};

export function TurnaroundPanel() {
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: Cached = JSON.parse(raw);
        setPlan(parsed.plan);
        setGeneratedAt(parsed.ts);
      }
    } catch {}
  }, []);

  function fetchPlan() {
    setError(null);
    start(async () => {
      try {
        const r = await fetch("/api/ai/turnaround-plan", { method: "POST" });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          setError(t || `Hata ${r.status}`);
          return;
        }
        const data = (await r.json()) as Plan;
        const ts = Date.now();
        setPlan(data);
        setGeneratedAt(ts);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts, plan: data } as Cached),
          );
        } catch {}
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bağlantı hatası");
      }
    });
  }

  return (
    <Card className="border-fuchsia-500/30 bg-gradient-to-br from-fuchsia-500/[0.04] via-indigo-500/[0.03] to-emerald-500/[0.02]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-fuchsia-500" />
              3 Aylık Kurtarma Planı
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                AI
              </span>
            </CardTitle>
            <CardDescription>
              Gelir + kesin ödemeler (maaş/kira/vergi) + scheduled gider →
              3 aylık projeksiyon + somut aksiyon planı + grafiksel kanıt.
            </CardDescription>
            {generatedAt && (
              <div className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 text-[10px] text-[color:var(--color-muted)]">
                <Clock className="h-2.5 w-2.5" />
                {new Date(generatedAt).toLocaleString("tr-TR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                tarihinde üretildi
              </div>
            )}
          </div>
          <Button
            type="button"
            size="sm"
            onClick={fetchPlan}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Plan hazırlanıyor…
              </>
            ) : (
              <>
                {plan ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {plan ? "Yenile" : "Plan üret"}
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

        {!plan && !pending && !error && (
          <div className="py-6 text-center text-xs text-[color:var(--color-muted)]">
            <strong>Plan üret</strong> butonuna bas — AI verileri analiz edip
            (~15-25 sn) 3 aylık plan + grafik üretir.
          </div>
        )}

        {plan && <PlanBody plan={plan} />}
      </CardContent>
    </Card>
  );
}

function PlanBody({ plan }: { plan: Plan }) {
  const banner = SEVERITY_BANNER[plan.severity] ?? SEVERITY_BANNER.warning;
  const BannerIcon = banner.Icon;

  const diff = plan.projected_with_plan_minor - plan.projected_90day_balance_minor;

  return (
    <div className="space-y-5">
      <div className={cn("flex items-start gap-2 rounded-lg border p-3 text-xs", banner.tone)}>
        <BannerIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-0.5">
          <div className="font-medium">{banner.title}</div>
          {plan.summary && <div className="text-[11px] opacity-90">{plan.summary}</div>}
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Mevcut bakiye" value={fmtTry(plan.current_balance_minor)} />
        <MiniStat
          label="90g sonu (plan yok)"
          value={fmtTry(plan.projected_90day_balance_minor)}
          tone={plan.projected_90day_balance_minor < 0 ? "danger" : "neutral"}
        />
        <MiniStat
          label="90g sonu (plan ile)"
          value={fmtTry(plan.projected_with_plan_minor)}
          tone={plan.projected_with_plan_minor >= 0 ? "success" : "danger"}
        />
        <MiniStat
          label="AI etkisi"
          value={(diff >= 0 ? "+" : "") + fmtTry(diff)}
          tone={diff >= 0 ? "success" : "danger"}
          hint="Plan ile fark"
        />
      </div>

      {/* Line chart: planlı vs plansız */}
      {plan.monthly.length > 0 && <ProjectionChart monthly={plan.monthly} />}

      {/* Bar chart: kategori bazında gider */}
      {plan.category_bars.length > 0 && (
        <CategoryBarChart bars={plan.category_bars} />
      )}

      {/* Action timeline */}
      {plan.actions.length > 0 && <ActionTimeline actions={plan.actions} />}
    </div>
  );
}

function MiniStat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-500"
        : "text-[color:var(--color-fg)]";
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </div>
      <div className={cn("mt-0.5 text-base font-semibold tabular-nums", toneClass)}>
        {value}
      </div>
      {hint && (
        <div className="mt-0.5 text-[10px] text-[color:var(--color-muted)]">
          {hint}
        </div>
      )}
    </div>
  );
}

function ProjectionChart({ monthly }: { monthly: Monthly[] }) {
  // 4 nokta: bugün (0) + 3 ay sonu
  const points = [
    { label: "Bugün", no_plan: monthly[0] ? monthly[0].balance_minor - (monthly[0].revenue_minor - monthly[0].expense_minor - monthly[0].scheduled_minor) : 0, with_plan: 0 },
  ];
  const startBal = points[0].no_plan;
  points[0].with_plan = startBal;

  for (const m of monthly) {
    points.push({
      label: m.month_label,
      no_plan: m.balance_minor,
      with_plan: m.balance_with_plan_minor,
    });
  }

  const allValues = points.flatMap((p) => [p.no_plan, p.with_plan]);
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 0);
  const range = Math.max(1, maxV - minV);

  const W = 600;
  const H = 160;
  const PAD = 20;
  const innerW = W - PAD * 2;
  const innerH = H - PAD * 2;
  const stepX = innerW / Math.max(1, points.length - 1);

  function y(v: number): number {
    return PAD + ((maxV - v) / range) * innerH;
  }

  const pathNoPlan = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(PAD + i * stepX).toFixed(1)} ${y(p.no_plan).toFixed(1)}`)
    .join(" ");
  const pathWithPlan = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${(PAD + i * stepX).toFixed(1)} ${y(p.with_plan).toFixed(1)}`)
    .join(" ");

  const zeroY = y(0);

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.015] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        <span>Bakiye projeksiyonu</span>
        <span className="flex items-center gap-3 normal-case tracking-normal">
          <span className="inline-flex items-center gap-1">
            <span className="h-0.5 w-3 bg-red-500" />
            <span className="text-[10px]">Plan yok</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-0.5 w-3 bg-emerald-500" />
            <span className="text-[10px]">Plan ile</span>
          </span>
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-40 w-full">
        {minV < 0 && (
          <line
            x1={PAD}
            x2={W - PAD}
            y1={zeroY}
            y2={zeroY}
            stroke="currentColor"
            strokeWidth={0.5}
            strokeDasharray="3 3"
            className="text-red-500/40"
          />
        )}
        <path
          d={pathNoPlan}
          stroke="currentColor"
          strokeWidth={2}
          fill="none"
          className="text-red-500"
          strokeDasharray="4 3"
        />
        <path
          d={pathWithPlan}
          stroke="currentColor"
          strokeWidth={2.5}
          fill="none"
          className="text-emerald-500"
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={PAD + i * stepX}
              cy={y(p.no_plan)}
              r={2}
              className="fill-red-500"
            />
            <circle
              cx={PAD + i * stepX}
              cy={y(p.with_plan)}
              r={3}
              className="fill-emerald-500"
            />
            <text
              x={PAD + i * stepX}
              y={H - 4}
              textAnchor="middle"
              className="fill-[color:var(--color-muted)] text-[9px]"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function CategoryBarChart({ bars }: { bars: CategoryBar[] }) {
  const sorted = [...bars].sort((a, b) => b.amount_minor - a.amount_minor);
  const max = Math.max(1, ...sorted.map((b) => b.amount_minor));
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.015] p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        <TrendingDown className="h-3 w-3" />
        Son 90 gün — kategori bazında gider
      </div>
      <ul className="space-y-1.5">
        {sorted.slice(0, 8).map((b) => {
          const pct = (b.amount_minor / max) * 100;
          return (
            <li key={b.category} className="flex items-center gap-3 text-xs">
              <span className="w-36 truncate">
                {EXPENSE_CATEGORY_LABELS[b.category as ExpenseCategoryValue] ?? b.category}
              </span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-[color:var(--color-fg)]/[0.04]">
                <div
                  className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-fuchsia-500 to-red-500"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <span className="w-20 shrink-0 text-right font-mono tabular-nums">
                {fmtTry(b.amount_minor)}
              </span>
              <span className="w-10 shrink-0 text-right text-[10px] text-[color:var(--color-muted)]">
                %{b.pct}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ActionTimeline({ actions }: { actions: Action[] }) {
  const sorted = [...actions].sort((a, b) => {
    const wa = a.week ?? 99;
    const wb = b.week ?? 99;
    if (wa !== wb) return wa - wb;
    const urg = { high: 0, medium: 1, low: 2 } as const;
    return (urg[a.urgency] ?? 3) - (urg[b.urgency] ?? 3);
  });

  const totalImpact = actions.reduce((s, a) => s + a.impact_minor_monthly, 0);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          <CalendarDays className="h-3 w-3" />
          Aksiyon planı ({sorted.length})
        </div>
        <div className="text-[11px] text-[color:var(--color-muted)]">
          Tahmini aylık etki:{" "}
          <strong className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            +{fmtTry(totalImpact)}
          </strong>
        </div>
      </div>
      <ol className="space-y-2">
        {sorted.map((a, i) => {
          const meta =
            ACTION_CATEGORY_META[a.category] ?? ACTION_CATEGORY_META.OTHER;
          const Icon = meta.Icon;
          return (
            <li
              key={i}
              className={cn(
                "rounded-lg border p-3",
                URGENCY_META[a.urgency] ?? URGENCY_META.medium,
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  <span
                    className={cn(
                      "grid h-7 w-7 shrink-0 place-items-center rounded-md",
                      meta.tone,
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">
                      {a.title}
                    </div>
                    <div className="mt-1 text-xs text-[color:var(--color-muted)] leading-relaxed">
                      {a.description}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono tabular-nums text-xs text-emerald-600 dark:text-emerald-400">
                    +{fmtTry(a.impact_minor_monthly)} / ay
                  </div>
                  <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] uppercase tracking-wider text-[color:var(--color-muted)]">
                    {a.week != null && <span>Hafta {a.week}</span>}
                    <span className="rounded-full bg-[color:var(--color-fg)]/[0.08] px-1.5 py-0.5">
                      {a.urgency}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
