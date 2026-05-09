"use client";

import { useMemo, useState } from "react";
import { BarChart3, LineChart } from "lucide-react";
import type { ChartPayload } from "@/types/chat";
import { cn } from "@/lib/cn";

function formatValue(v: number, unit?: string): string {
  if (unit === "₺" || unit === "TRY") {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(v);
  }
  if (unit === "%") {
    return `${v.toLocaleString("tr-TR")}%`;
  }
  const formatted = new Intl.NumberFormat("tr-TR").format(v);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function ChartBlock({ chart }: { chart: ChartPayload }) {
  if (!chart.values?.length || chart.values.length !== chart.labels.length) {
    return (
      <div className="my-3 rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4 text-xs text-amber-700 dark:text-amber-400">
        Grafik verisi geçersiz (etiket/değer uyumsuz).
      </div>
    );
  }

  const total = chart.values.reduce((sum, v) => sum + v, 0);
  const max = Math.max(1, ...chart.values);
  const min = Math.min(0, ...chart.values);

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-fg)]/[0.025] to-[color:var(--color-fg)]/[0.01]">
      <div className="flex items-baseline justify-between border-b border-[color:var(--color-border)]/60 px-4 py-3">
        <div className="flex items-center gap-2">
          {chart.type === "line" ? (
            <LineChart className="h-3.5 w-3.5 text-fuchsia-500" />
          ) : (
            <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
          )}
          <h4 className="text-sm font-semibold tracking-tight">{chart.title}</h4>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-[color:var(--color-muted)]">
          <span>
            <span className="font-medium">{chart.values.length}</span> nokta
          </span>
          {chart.unit && (
            <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-0.5 font-mono uppercase tracking-wider">
              {chart.unit}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {chart.type === "line" ? (
          <LineSparkline labels={chart.labels} values={chart.values} max={max} min={min} unit={chart.unit} />
        ) : (
          <BarRows labels={chart.labels} values={chart.values} max={max} unit={chart.unit} />
        )}

        <div className="mt-4 flex items-center justify-between border-t border-[color:var(--color-border)]/60 pt-3 text-[10px] text-[color:var(--color-muted)]">
          <span>
            Toplam:{" "}
            <span className="font-medium text-[color:var(--color-fg)]">
              {formatValue(total, chart.unit)}
            </span>
          </span>
          <span>
            Maks:{" "}
            <span className="font-medium text-[color:var(--color-fg)]">
              {formatValue(max, chart.unit)}
            </span>
          </span>
          <span>
            Ort:{" "}
            <span className="font-medium text-[color:var(--color-fg)]">
              {formatValue(total / chart.values.length, chart.unit)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function BarRows({
  labels,
  values,
  max,
  unit,
}: {
  labels: string[];
  values: number[];
  max: number;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <ul className="space-y-2">
      {labels.map((label, i) => {
        const value = values[i] ?? 0;
        const pct = (value / max) * 100;
        const active = hover === i;
        return (
          <li
            key={`${label}-${i}`}
            className="group flex items-center gap-3 text-xs"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className={cn(
                "w-32 shrink-0 truncate transition",
                active
                  ? "text-[color:var(--color-fg)]"
                  : "text-[color:var(--color-muted)]"
              )}
            >
              {label}
            </span>
            <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-md bg-gradient-to-r transition-all",
                  active
                    ? "from-indigo-600 to-fuchsia-500 shadow-sm shadow-fuchsia-500/40"
                    : "from-indigo-500 to-fuchsia-500"
                )}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
            <span
              className={cn(
                "w-24 shrink-0 text-right font-mono tabular-nums transition",
                active && "font-semibold text-[color:var(--color-fg)]"
              )}
            >
              {formatValue(value, unit)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function LineSparkline({
  labels,
  values,
  max,
  min,
  unit,
}: {
  labels: string[];
  values: number[];
  max: number;
  min: number;
  unit?: string;
}) {
  const W = 600;
  const H = 140;
  const PAD_X = 8;
  const PAD_TOP = 8;
  const PAD_BOTTOM = 24;
  const range = Math.max(1, max - min);
  const stepX = (W - PAD_X * 2) / Math.max(1, values.length - 1);
  const innerH = H - PAD_TOP - PAD_BOTTOM;

  const coords = useMemo(
    () =>
      values.map((v, i) => ({
        x: PAD_X + i * stepX,
        y: PAD_TOP + (1 - (v - min) / range) * innerH,
        v,
      })),
    [values, min, range, stepX, innerH]
  );

  const [hover, setHover] = useState<number | null>(null);

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area =
    coords.length > 0
      ? `${PAD_X},${H - PAD_BOTTOM} ${line} ${
          PAD_X + (coords.length - 1) * stepX
        },${H - PAD_BOTTOM}`
      : "";

  // 3 grid lines: bottom, middle, top.
  const gridYs = [PAD_TOP, PAD_TOP + innerH / 2, PAD_TOP + innerH];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-32 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="line-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(99 102 241)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(99 102 241)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="line-stroke" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgb(99 102 241)" />
            <stop offset="100%" stopColor="rgb(232 121 249)" />
          </linearGradient>
        </defs>

        {gridYs.map((y, i) => (
          <line
            key={i}
            x1={PAD_X}
            x2={W - PAD_X}
            y1={y}
            y2={y}
            stroke="currentColor"
            strokeOpacity="0.06"
            strokeDasharray="2 4"
          />
        ))}

        {area && <polygon points={area} fill="url(#line-area)" />}
        <polyline
          points={line}
          fill="none"
          stroke="url(#line-stroke)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {coords.map((c, i) => (
          <g key={i}>
            <circle
              cx={c.x}
              cy={c.y}
              r={hover === i ? 4 : 2.5}
              fill="rgb(99 102 241)"
              stroke="white"
              strokeWidth="1.5"
              className="transition-all"
            />
            <rect
              x={c.x - stepX / 2}
              y={0}
              width={stepX}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[120%] rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-[10px] font-medium shadow-md"
          style={{
            left: `${(coords[hover].x / W) * 100}%`,
            top: `${(coords[hover].y / H) * 100}%`,
          }}
        >
          <div className="text-[color:var(--color-muted)]">{labels[hover]}</div>
          <div className="font-mono tabular-nums">
            {formatValue(coords[hover].v, unit)}
          </div>
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px] text-[color:var(--color-muted)]">
        <span>{labels[0]}</span>
        {labels.length > 2 && <span>{labels[Math.floor(labels.length / 2)]}</span>}
        <span>{labels[labels.length - 1]}</span>
      </div>
    </div>
  );
}
