"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
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

const CACHE_KEY = "commerceos:cashflow-forecast-v1";
type Cached = { ts: number; forecast: Forecast };

export function CashflowForecast() {
  const [pending, start] = useTransition();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [generatedAt, setGeneratedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Mount'ta cache'den yükle
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed: Cached = JSON.parse(raw);
        setForecast(parsed.forecast);
        setGeneratedAt(parsed.ts);
      }
    } catch {}
  }, []);

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
        const ts = Date.now();
        setForecast(data);
        setGeneratedAt(ts);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts, forecast: data } as Cached),
          );
        } catch {}
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

      <WeeklyBreakdown daily={forecast.daily} startBalance={startBalance} />

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
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    if (daily.length === 0) return { min: 0, max: 0, avg: 0 };
    const vals = daily.map((d) => d.balance_minor);
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 0);
    const avg = Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
    return { min, max, avg };
  }, [daily]);

  if (daily.length === 0) return null;

  const W = 800;
  const H = 220;
  const PAD_L = 64;
  const PAD_R = 12;
  const PAD_T = 16;
  const PAD_B = 30;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const range = Math.max(1, stats.max - stats.min);

  function xAt(i: number): number {
    return PAD_L + (i / Math.max(1, daily.length - 1)) * innerW;
  }
  function yAt(v: number): number {
    return PAD_T + ((stats.max - v) / range) * innerH;
  }

  const pathD = daily
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(d.balance_minor).toFixed(1)}`)
    .join(" ");
  const zeroY = yAt(0);
  const avgY = yAt(stats.avg);
  // Area = line down to zero line (negatif kısımlar zero line altında görünür)
  const lastX = xAt(daily.length - 1);
  const firstX = xAt(0);
  const areaD = `${pathD} L ${lastX.toFixed(1)} ${zeroY.toFixed(1)} L ${firstX.toFixed(1)} ${zeroY.toFixed(1)} Z`;

  // Y-axis tick'leri: 0 zorunlu, min, max, ortalama
  const yTicks = Array.from(
    new Set([stats.min, stats.min / 2, 0, stats.max / 2, stats.max].filter((v) => v !== 0 || stats.min < 0)),
  ).sort((a, b) => b - a);

  // X-axis ~5 tarih
  const xTickCount = Math.min(5, daily.length);
  const xTicks: number[] = [];
  for (let k = 0; k < xTickCount; k++) {
    const idx = Math.round(((daily.length - 1) * k) / Math.max(1, xTickCount - 1));
    if (!xTicks.includes(idx)) xTicks.push(idx);
  }

  function fmtCompact(v: number): string {
    const tl = v / 100;
    const sign = tl < 0 ? "-" : "";
    const abs = Math.abs(tl);
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M ₺`;
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}K ₺`;
    return `${sign}${Math.round(abs)} ₺`;
  }

  const hover = hoverIdx != null ? daily[hoverIdx] : null;
  const hoverX = hoverIdx != null ? xAt(hoverIdx) : 0;

  return (
    <div className="relative rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.015] p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          Günlük bakiye projeksiyonu
        </span>
        <div className="flex items-center gap-3 text-[10px] text-[color:var(--color-muted)]">
          <span className="inline-flex items-center gap-1">
            <span className="h-1 w-3 rounded-sm bg-gradient-to-r from-indigo-500 to-emerald-500" />
            bakiye
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-px w-3 border-t-2 border-dashed border-amber-500" />
            ortalama
          </span>
          {stats.min < 0 && (
            <span className="inline-flex items-center gap-1">
              <span className="h-px w-3 border-t-2 border-dotted border-red-500" />
              sıfır
            </span>
          )}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-56 w-full overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const xPx = e.clientX - rect.left;
          const xUser = (xPx / rect.width) * W;
          let best = 0;
          let bestDist = Infinity;
          for (let i = 0; i < daily.length; i++) {
            const d = Math.abs(xAt(i) - xUser);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          }
          setHoverIdx(best);
        }}
      >
        <defs>
          <linearGradient id="bal-area-pos" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129 / 0.35)" />
            <stop offset="100%" stopColor="rgb(16 185 129 / 0)" />
          </linearGradient>
          <linearGradient id="bal-area-neg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(239 68 68 / 0)" />
            <stop offset="100%" stopColor="rgb(239 68 68 / 0.35)" />
          </linearGradient>
          <linearGradient id="bal-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(99 102 241)" />
            <stop offset="100%" stopColor="rgb(16 185 129)" />
          </linearGradient>
          {/* Clip path for positive/negative split */}
          <clipPath id="clip-positive">
            <rect x={PAD_L} y={PAD_T} width={innerW} height={Math.max(0, zeroY - PAD_T)} />
          </clipPath>
          <clipPath id="clip-negative">
            <rect x={PAD_L} y={zeroY} width={innerW} height={Math.max(0, H - PAD_B - zeroY)} />
          </clipPath>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((v, i) => (
          <g key={`yt-${i}`}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-[color:var(--color-border)]"
              strokeDasharray={Math.abs(v) < 0.001 ? "0" : "2 4"}
            />
            <text
              x={PAD_L - 8}
              y={yAt(v) + 4}
              textAnchor="end"
              className="fill-[color:var(--color-muted)] text-[10px] tabular-nums"
            >
              {fmtCompact(v)}
            </text>
          </g>
        ))}

        {/* X-axis tarih label'ları */}
        {xTicks.map((i) => (
          <text
            key={`xt-${i}`}
            x={xAt(i)}
            y={H - 10}
            textAnchor="middle"
            className="fill-[color:var(--color-muted)] text-[10px]"
          >
            {formatDate(daily[i].date)}
          </text>
        ))}

        {/* Area pozitif kısım */}
        <path d={areaD} fill="url(#bal-area-pos)" clipPath="url(#clip-positive)" />
        {/* Area negatif kısım */}
        {stats.min < 0 && (
          <path d={areaD} fill="url(#bal-area-neg)" clipPath="url(#clip-negative)" />
        )}

        {/* Zero line (negatif varsa belirgin) */}
        {stats.min < 0 && (
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={zeroY}
            y2={zeroY}
            stroke="rgb(239 68 68)"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            opacity="0.6"
          />
        )}

        {/* Avg line */}
        <line
          x1={PAD_L}
          x2={W - PAD_R}
          y1={avgY}
          y2={avgY}
          stroke="rgb(245 158 11)"
          strokeWidth={1.2}
          strokeDasharray="4 4"
          opacity="0.7"
        />

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#bal-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data dots — sadece uyarı günleri belirgin */}
        {daily.map((d, i) => {
          const isWarn = warningDates.has(d.date);
          const isHover = hoverIdx === i;
          if (!isWarn && !isHover) return null;
          return (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(d.balance_minor)}
              r={isHover ? 6 : 4}
              className={
                isWarn
                  ? "fill-red-500 stroke-[color:var(--color-bg)]"
                  : "fill-indigo-500 stroke-[color:var(--color-bg)]"
              }
              strokeWidth={2}
            />
          );
        })}

        {/* Hover dikey çizgi */}
        {hoverIdx != null && (
          <line
            x1={hoverX}
            x2={hoverX}
            y1={PAD_T}
            y2={H - PAD_B}
            stroke="currentColor"
            strokeWidth={1}
            className="text-[color:var(--color-fg)]/30"
          />
        )}
      </svg>

      {/* Hover info kartı */}
      {hover && hoverIdx != null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-xs shadow-lg shadow-black/10"
          style={{
            left: `calc(${((hoverX / W) * 100).toFixed(2)}% )`,
            top: 0,
          }}
        >
          <div className="font-semibold">
            {new Date(hover.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
            })}
          </div>
          <div className="mt-0.5 font-mono tabular-nums">
            <span className={hover.balance_minor < 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}>
              {formatTry(hover.balance_minor)}
            </span>
            <span className="ml-2 text-[10px] text-[color:var(--color-muted)]">
              +{formatTry(hover.in_minor)} / −{formatTry(hover.out_minor)}
            </span>
          </div>
          {hover.note && (
            <div className="mt-1 max-w-xs text-[10px] text-[color:var(--color-muted)]">
              {hover.note}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function WeeklyBreakdown({
  daily,
  startBalance,
}: {
  daily: ForecastDay[];
  startBalance: number;
}) {
  if (daily.length === 0) return null;
  // 7-günlük gruplar
  const weeks: Array<{
    label: string;
    inSum: number;
    outSum: number;
    netDelta: number;
    endBalance: number;
    startDate: string;
    endDate: string;
  }> = [];
  for (let i = 0; i < daily.length; i += 7) {
    const slice = daily.slice(i, i + 7);
    const inSum = slice.reduce((s, d) => s + d.in_minor, 0);
    const outSum = slice.reduce((s, d) => s + d.out_minor, 0);
    const startBal = i === 0 ? startBalance : daily[i - 1].balance_minor;
    const endBalance = slice[slice.length - 1].balance_minor;
    weeks.push({
      label: `Hafta ${weeks.length + 1}`,
      inSum,
      outSum,
      netDelta: endBalance - startBal,
      endBalance,
      startDate: slice[0].date,
      endDate: slice[slice.length - 1].date,
    });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--color-border)]">
      <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.03] px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        Haftalık özet
      </div>
      <div className="divide-y divide-[color:var(--color-border)]">
        {weeks.map((w) => {
          const positive = w.netDelta >= 0;
          return (
            <div
              key={w.label}
              className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-xs"
            >
              <div className="col-span-3 sm:col-span-2">
                <div className="font-medium">{w.label}</div>
                <div className="text-[10px] text-[color:var(--color-muted)]">
                  {formatDate(w.startDate)} – {formatDate(w.endDate)}
                </div>
              </div>
              <div className="col-span-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatTry(w.inSum)}
              </div>
              <div className="col-span-3 text-right tabular-nums text-red-500">
                −{formatTry(w.outSum)}
              </div>
              <div className="col-span-3 sm:col-span-4 flex items-center justify-end gap-2">
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums",
                    positive
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "bg-red-500/10 text-red-600",
                  )}
                >
                  {positive ? "+" : ""}
                  {formatTry(w.netDelta)}
                </span>
                <span className="text-right text-[10px] tabular-nums text-[color:var(--color-muted)]">
                  →{formatTry(w.endBalance)}
                </span>
              </div>
            </div>
          );
        })}
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
