"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import type { RevenuePoint } from "@/lib/queries/analytics";

/**
 * SVG-based gelir trendi grafiği.
 *  • Y ekseninde 0 - max arası 4 seviye TL etiketi
 *  • X ekseninde ~6 tarih tick'i (5'er günde bir)
 *  • Area fill (emerald→indigo gradient) + line + dots
 *  • Ortalama yatay çizgisi
 *  • Hover'da dot büyür, üstte bilgi kartı belirir
 */
export function RevenueChart({
  data,
  currency = "TRY",
}: {
  data: RevenuePoint[];
  currency?: string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    if (data.length === 0)
      return { max: 0, avg: 0, total: 0, nonZero: 0 };
    const total = data.reduce((s, p) => s + p.total, 0);
    const max = Math.max(...data.map((p) => p.total));
    const nonZero = data.filter((p) => p.total > 0).length;
    const avg = nonZero > 0 ? Math.round(total / nonZero) : 0;
    return { max, avg, total, nonZero };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-[color:var(--color-muted)]">
        Bu dönemde gelir verisi yok.
      </div>
    );
  }

  // SVG koordinat sistemi
  const W = 800;
  const H = 240;
  const PAD_L = 56; // y ekseni için
  const PAD_R = 12;
  const PAD_T = 18;
  const PAD_B = 26;
  const innerW = W - PAD_L - PAD_R;
  const innerH = H - PAD_T - PAD_B;
  const yMax = Math.max(stats.max, 1);

  function xAt(i: number): number {
    if (data.length === 1) return PAD_L + innerW / 2;
    return PAD_L + (i / (data.length - 1)) * innerW;
  }
  function yAt(v: number): number {
    return PAD_T + (1 - v / yMax) * innerH;
  }

  // Eksende 4 y tick — 0, yMax/3, 2yMax/3, yMax (yuvarlanmış)
  const yTicks = [0, yMax / 3, (yMax * 2) / 3, yMax];

  // x tick — ~6 tarih
  const xTickCount = Math.min(6, data.length);
  const xTicks: number[] = [];
  for (let k = 0; k < xTickCount; k++) {
    const idx = Math.round(((data.length - 1) * k) / Math.max(1, xTickCount - 1));
    if (!xTicks.includes(idx)) xTicks.push(idx);
  }

  // Path string
  const pathD = data
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i).toFixed(1)} ${yAt(p.total).toFixed(1)}`)
    .join(" ");
  // Area fill — alt sınıra in, kapat
  const areaD = `${pathD} L ${xAt(data.length - 1).toFixed(1)} ${(H - PAD_B).toFixed(1)} L ${xAt(0).toFixed(1)} ${(H - PAD_B).toFixed(1)} Z`;

  const avgY = yAt(stats.avg);
  const hover = hoverIdx != null ? data[hoverIdx] : null;
  const hoverX = hoverIdx != null ? xAt(hoverIdx) : 0;

  function shortDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getDate()} ${["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"][d.getMonth()]}`;
  }

  function fmtCompact(v: number): string {
    // kuruş → TL
    const tl = v / 100;
    if (tl >= 1_000_000) return `${(tl / 1_000_000).toFixed(1)}M`;
    if (tl >= 1_000) return `${Math.round(tl / 1_000)}K`;
    return `${Math.round(tl)}`;
  }

  return (
    <div className="relative">
      {/* Üst özet — toplam + ortalama */}
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-[color:var(--color-muted)]">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-gradient-to-r from-emerald-500 to-indigo-500" />
          Günlük ciro
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-px w-3 border-t-2 border-dashed border-amber-500" />
          Ortalama: <strong className="font-mono tabular-nums text-[color:var(--color-fg)]">{formatMoney(stats.avg, currency)}</strong>
        </span>
        <span className="ml-auto">
          {stats.nonZero}/{data.length} aktif gün
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-64 w-full overflow-visible"
        onMouseLeave={() => setHoverIdx(null)}
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const xPx = e.clientX - rect.left;
          const xUser = (xPx / rect.width) * W;
          // En yakın point'i bul
          let best = 0;
          let bestDist = Infinity;
          for (let i = 0; i < data.length; i++) {
            const d = Math.abs(xAt(i) - xUser);
            if (d < bestDist) {
              bestDist = d;
              best = i;
            }
          }
          setHoverIdx(best);
        }}
      >
        {/* Defs: gradient */}
        <defs>
          <linearGradient id="rev-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(16 185 129 / 0.35)" />
            <stop offset="60%" stopColor="rgb(99 102 241 / 0.15)" />
            <stop offset="100%" stopColor="rgb(99 102 241 / 0)" />
          </linearGradient>
          <linearGradient id="rev-line" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(16 185 129)" />
            <stop offset="100%" stopColor="rgb(99 102 241)" />
          </linearGradient>
        </defs>

        {/* Y-axis grid + labels */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={W - PAD_R}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-[color:var(--color-border)]"
              strokeDasharray={i === 0 ? "0" : "2 4"}
            />
            <text
              x={PAD_L - 8}
              y={yAt(v) + 4}
              textAnchor="end"
              className="fill-[color:var(--color-muted)] text-[10px] tabular-nums"
            >
              {fmtCompact(v)} ₺
            </text>
          </g>
        ))}

        {/* X-axis tick labels */}
        {xTicks.map((i) => (
          <text
            key={i}
            x={xAt(i)}
            y={H - 8}
            textAnchor="middle"
            className="fill-[color:var(--color-muted)] text-[10px]"
          >
            {shortDate(data[i].date)}
          </text>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#rev-area)" />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="url(#rev-line)"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Avg line */}
        {stats.avg > 0 && (
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={avgY}
            y2={avgY}
            stroke="rgb(245 158 11)"
            strokeWidth={1.2}
            strokeDasharray="4 4"
            opacity="0.8"
          />
        )}

        {/* Data dots */}
        {data.map((p, i) => {
          const isHover = hoverIdx === i;
          const isMax = p.total === stats.max && stats.max > 0;
          return (
            <circle
              key={i}
              cx={xAt(i)}
              cy={yAt(p.total)}
              r={isHover ? 5 : isMax ? 3.5 : 2}
              className={
                isMax
                  ? "fill-emerald-500 stroke-[color:var(--color-bg)]"
                  : "fill-indigo-500 stroke-[color:var(--color-bg)]"
              }
              strokeWidth={1.5}
            />
          );
        })}

        {/* Hover vertical line */}
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
            left: `${((hoverX / W) * 100).toFixed(2)}%`,
            top: 0,
          }}
        >
          <div className="font-semibold">
            {new Date(hover.date).toLocaleDateString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          <div className="mt-1 font-mono tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatMoney(hover.total, currency)}
            </span>
            <span className="ml-2 text-[color:var(--color-muted)]">
              {hover.orders} sipariş
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
