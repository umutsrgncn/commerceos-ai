"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/cn";

type ForecastDay = {
  date: string;
  in_minor: number;
  out_minor: number;
  balance_minor: number;
  note?: string | null;
};

type ForecastWarning = {
  date: string;
  severity: "high" | "medium" | "low";
  message: string;
};

type Forecast = {
  starting_balance_minor: number;
  daily: ForecastDay[];
  warnings: ForecastWarning[];
  summary: string;
  pending_orders_count: number;
};

function formatTry(minor: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(minor / 100);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return iso;
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function CashflowForecast() {
  const [pending, start] = useTransition();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState<string | null>(null);

  function fetchForecast() {
    setError(null);
    start(async () => {
      try {
        const r = await fetch("/api/ai/cashflow-forecast", { method: "POST" });
        if (!r.ok) {
          const t = await r.text().catch(() => "");
          setError(t || `Hata ${r.status}`);
          return;
        }
        const data = (await r.json()) as Forecast;
        setForecast(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bağlantı hatası");
      }
    });
  }

  return (
    <Card className="border-indigo-500/30 bg-gradient-to-br from-indigo-500/[0.04] to-fuchsia-500/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-500" />
              Önümüzdeki 30 gün — Cash flow tahmini
              <span className="rounded-full bg-fuchsia-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-700 dark:text-fuchsia-400">
                AI
              </span>
            </CardTitle>
            <CardDescription>
              Son 90 gün satış/gider pattern'i + bekleyen siparişler →
              Gemini tahmini, riskli günleri vurgular.
            </CardDescription>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={fetchForecast}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Hesaplıyor...
              </>
            ) : (
              <>
                {forecast ? (
                  <RefreshCw className="h-3.5 w-3.5" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                {forecast ? "Yenile" : "Tahmin üret"}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!forecast && !pending && !error && (
          <div className="py-6 text-center text-xs text-[color:var(--color-muted)]">
            Tahmin üretmek için yukarıdaki butona bas. AI ~10-15 saniye sürer.
          </div>
        )}

        {forecast && <ForecastBody forecast={forecast} />}
      </CardContent>
    </Card>
  );
}

function ForecastBody({ forecast }: { forecast: Forecast }) {
  const lastDay = forecast.daily[forecast.daily.length - 1];
  const startBalance = forecast.starting_balance_minor;
  const endBalance = lastDay?.balance_minor ?? startBalance;
  const balanceDelta = endBalance - startBalance;

  const totalIn = forecast.daily.reduce((s, d) => s + d.in_minor, 0);
  const totalOut = forecast.daily.reduce((s, d) => s + d.out_minor, 0);

  // Min balance for risk visualization
  const minBalance = forecast.daily.reduce(
    (m, d) => (d.balance_minor < m ? d.balance_minor : m),
    forecast.daily[0]?.balance_minor ?? 0,
  );
  const minBalanceDay = forecast.daily.find(
    (d) => d.balance_minor === minBalance,
  );

  // Map warnings by date
  const warningDates = new Set(forecast.warnings.map((w) => w.date));

  return (
    <div className="space-y-4">
      {forecast.summary && (
        <p className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] p-3 text-sm">
          <span className="font-medium">Özet:</span> {forecast.summary}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="Beklenen gelir"
          value={formatTry(totalIn)}
          tone="success"
        />
        <Stat
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Beklenen gider"
          value={formatTry(totalOut)}
          tone="warning"
        />
        <Stat
          icon={<CalendarDays className="h-3.5 w-3.5" />}
          label="Min. bakiye"
          value={formatTry(minBalance)}
          hint={minBalanceDay ? formatDate(minBalanceDay.date) : ""}
          tone={minBalance < 0 ? "danger" : "neutral"}
        />
        <Stat
          icon={<TrendingUp className="h-3.5 w-3.5" />}
          label="30g sonu bakiye"
          value={formatTry(endBalance)}
          hint={
            balanceDelta >= 0
              ? `+${formatTry(balanceDelta)}`
              : formatTry(balanceDelta)
          }
          tone={balanceDelta >= 0 ? "success" : "danger"}
        />
      </div>

      <BalanceChart daily={forecast.daily} warningDates={warningDates} />

      {forecast.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wider text-[color:var(--color-muted)]">
            Risk uyarıları ({forecast.warnings.length})
          </div>
          <div className="space-y-2">
            {forecast.warnings.map((w, i) => (
              <WarningCard key={i} warning={w} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BalanceChart({
  daily,
  warningDates,
}: {
  daily: ForecastDay[];
  warningDates: Set<string>;
}) {
  if (daily.length === 0) return null;
  const minB = Math.min(...daily.map((d) => d.balance_minor), 0);
  const maxB = Math.max(...daily.map((d) => d.balance_minor), 0);
  const range = Math.max(1, maxB - minB);

  const W = 600;
  const H = 120;
  const PAD = 4;
  const stepX = (W - PAD * 2) / Math.max(1, daily.length - 1);

  const points = daily.map((d, i) => {
    const x = PAD + i * stepX;
    const y = PAD + ((maxB - d.balance_minor) / range) * (H - PAD * 2);
    return { x, y, d };
  });

  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  // Zero line
  const zeroY = PAD + (maxB / range) * (H - PAD * 2);

  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.015] p-3">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        <span>Günlük bakiye projeksiyonu</span>
        <span>{daily.length} gün</span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
      >
        {minB < 0 && zeroY > 0 && zeroY < H && (
          <line
            x1={PAD}
            y1={zeroY}
            x2={W - PAD}
            y2={zeroY}
            stroke="currentColor"
            strokeWidth={0.5}
            strokeDasharray="2 2"
            className="text-red-500/40"
          />
        )}
        <path
          d={`${path} L ${(W - PAD).toFixed(1)} ${H - PAD} L ${PAD} ${H - PAD} Z`}
          fill="currentColor"
          className="text-indigo-500/15"
        />
        <path
          d={path}
          stroke="currentColor"
          strokeWidth={1.5}
          fill="none"
          className="text-indigo-500"
        />
        {points.map((p, i) => {
          const isWarn = warningDates.has(p.d.date);
          return (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={isWarn ? 3 : 1.5}
              fill="currentColor"
              className={isWarn ? "text-red-500" : "text-indigo-500/60"}
            >
              <title>
                {formatDate(p.d.date)}: {formatTry(p.d.balance_minor)}
                {p.d.note ? ` — ${p.d.note}` : ""}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-[color:var(--color-muted)]">
        <span>{formatDate(daily[0]?.date ?? "")}</span>
        <span>{formatDate(daily[daily.length - 1]?.date ?? "")}</span>
      </div>
    </div>
  );
}

function WarningCard({ warning }: { warning: ForecastWarning }) {
  const tone =
    warning.severity === "high"
      ? "border-red-500/30 bg-red-500/[0.04] text-red-700 dark:text-red-400"
      : warning.severity === "medium"
        ? "border-amber-500/30 bg-amber-500/[0.04] text-amber-700 dark:text-amber-400"
        : "border-indigo-500/30 bg-indigo-500/[0.04] text-indigo-700 dark:text-indigo-400";
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-xs",
        tone,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div className="space-y-0.5">
        <div className="font-medium">
          {formatDate(warning.date)}
          <span className="ml-2 rounded-full bg-[color:var(--color-fg)]/[0.08] px-1.5 py-0.5 text-[9px] uppercase tracking-wider">
            {warning.severity}
          </span>
        </div>
        <div className="text-[color:var(--color-muted)]">{warning.message}</div>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "danger"
        ? "text-red-500"
        : tone === "warning"
          ? "text-amber-600 dark:text-amber-400"
          : "text-[color:var(--color-fg)]";
  return (
    <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-2.5">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {icon}
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
