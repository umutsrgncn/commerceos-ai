"use client";

import { useMemo } from "react";
import { formatMoney } from "@/lib/format";
import type { RevenuePoint } from "@/lib/queries/analytics";

/**
 * Pure-CSS bar chart — no recharts dependency. Each bar is a flex child
 * with height proportional to its share of the max value.
 */
export function RevenueChart({ data, currency = "TRY" }: { data: RevenuePoint[]; currency?: string }) {
  const max = useMemo(() => Math.max(1, ...data.map((d) => d.total)), [data]);

  return (
    <div className="flex h-56 items-end gap-1 overflow-hidden">
      {data.map((point) => {
        const h = (point.total / max) * 100;
        const day = new Date(point.date);
        const label = `${day.getDate()}/${day.getMonth() + 1}`;
        const empty = point.total === 0;
        return (
          <div
            key={point.date}
            className="group relative flex flex-1 flex-col items-center justify-end"
            title={`${label}: ${formatMoney(point.total, currency)} (${point.orders} sipariş)`}
          >
            <div
              className={
                empty
                  ? "h-1 w-full rounded-t bg-[color:var(--color-fg)]/[0.05]"
                  : "w-full rounded-t bg-gradient-to-t from-indigo-500 to-fuchsia-500 transition group-hover:from-indigo-600 group-hover:to-fuchsia-400"
              }
              style={{ height: empty ? 4 : `${Math.max(4, h)}%` }}
            />
            <span className="absolute -top-7 hidden whitespace-nowrap rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-[10px] font-medium tabular-nums shadow-sm group-hover:block">
              {formatMoney(point.total, currency)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
