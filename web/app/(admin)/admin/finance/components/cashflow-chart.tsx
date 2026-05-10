"use client";

import { useMemo, useState } from "react";
import type { CashFlowPoint } from "@/lib/queries/finance";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CashflowChart({ data }: { data: CashFlowPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const { max, min, coords } = useMemo(() => {
    const values = data.flatMap((d) => [d.revenue, -d.expense, d.net]);
    const max = Math.max(1, ...values);
    const min = Math.min(0, ...values);
    return { max, min, coords: data };
  }, [data]);

  const W = 700;
  const H = 200;
  const PAD_X = 24;
  const PAD_TOP = 12;
  const PAD_BOTTOM = 28;
  const innerH = H - PAD_TOP - PAD_BOTTOM;
  const stepX = (W - PAD_X * 2) / Math.max(1, data.length - 1);
  const range = Math.max(1, max - min);

  const yFor = (v: number) => PAD_TOP + (1 - (v - min) / range) * innerH;
  const xFor = (i: number) => PAD_X + i * stepX;
  const zeroY = yFor(0);

  const revenuePts = coords.map((c, i) => `${xFor(i).toFixed(1)},${yFor(c.revenue).toFixed(1)}`).join(" ");
  const netPts = coords.map((c, i) => `${xFor(i).toFixed(1)},${yFor(c.net).toFixed(1)}`).join(" ");

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-48 w-full"
        preserveAspectRatio="none"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="cf-rev-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="rgb(16 185 129)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* zero line */}
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={zeroY}
          y2={zeroY}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeDasharray="3 3"
        />

        {/* expense bars (downward) */}
        {coords.map((c, i) => {
          const x = xFor(i) - stepX * 0.35;
          const y = zeroY;
          const h = (c.expense / range) * innerH;
          if (c.expense === 0) return null;
          return (
            <rect
              key={`exp-${i}`}
              x={x}
              y={y}
              width={stepX * 0.7}
              height={h}
              fill="rgb(239 68 68)"
              fillOpacity="0.6"
              rx="1"
            />
          );
        })}

        {/* revenue area + line */}
        <polygon
          points={`${PAD_X},${zeroY} ${revenuePts} ${(W - PAD_X).toFixed(1)},${zeroY}`}
          fill="url(#cf-rev-area)"
        />
        <polyline
          points={revenuePts}
          fill="none"
          stroke="rgb(16 185 129)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* net dashed */}
        <polyline
          points={netPts}
          fill="none"
          stroke="rgb(99 102 241)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 3"
        />

        {/* hover hit areas */}
        {coords.map((c, i) => (
          <rect
            key={`hit-${i}`}
            x={xFor(i) - stepX / 2}
            y={0}
            width={stepX}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}

        {/* hover marker */}
        {hover !== null && (
          <line
            x1={xFor(hover)}
            x2={xFor(hover)}
            y1={PAD_TOP}
            y2={H - PAD_BOTTOM}
            stroke="currentColor"
            strokeOpacity="0.2"
          />
        )}
      </svg>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-[color:var(--color-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-3 bg-emerald-500" /> Gelir
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-3 w-3 bg-red-500/60" /> Gider
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-3 border-b-2 border-dashed border-indigo-500" /> Net
        </span>
      </div>

      {/* Hover tooltip */}
      {hover !== null && (
        <div
          className={cn(
            "pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[10px] shadow-md"
          )}
          style={{
            left: `${(xFor(hover) / W) * 100}%`,
            top: `${(PAD_TOP / H) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-medium text-[color:var(--color-muted)]">
            {coords[hover].date}
          </div>
          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 font-mono tabular-nums">
            <span className="text-emerald-500">Gelir</span>
            <span className="text-right">
              {formatMoney(coords[hover].revenue, "TRY")}
            </span>
            <span className="text-red-500">Gider</span>
            <span className="text-right">
              {formatMoney(coords[hover].expense, "TRY")}
            </span>
            <span
              className={
                coords[hover].net >= 0 ? "text-indigo-500" : "text-red-500"
              }
            >
              Net
            </span>
            <span className="text-right">
              {formatMoney(coords[hover].net, "TRY")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
