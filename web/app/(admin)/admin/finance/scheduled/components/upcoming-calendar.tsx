"use client";

import { CalendarClock, TrendingDown } from "lucide-react";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";

type Item = {
  date: string;
  paymentId: string;
  name: string;
  amount: number;
  category: ExpenseCategoryValue;
};

const CATEGORY_HEX: Record<string, { bar: string; pill: string; ring: string }> = {
  PAYROLL: { bar: "from-fuchsia-500 to-fuchsia-400", pill: "bg-fuchsia-500", ring: "ring-fuchsia-500/30" },
  RENT: { bar: "from-red-500 to-red-400", pill: "bg-red-500", ring: "ring-red-500/30" },
  TAXES: { bar: "from-amber-500 to-amber-400", pill: "bg-amber-500", ring: "ring-amber-500/30" },
  UTILITIES: { bar: "from-sky-500 to-sky-400", pill: "bg-sky-500", ring: "ring-sky-500/30" },
  SOFTWARE: { bar: "from-indigo-500 to-indigo-400", pill: "bg-indigo-500", ring: "ring-indigo-500/30" },
  SHIPPING: { bar: "from-orange-500 to-orange-400", pill: "bg-orange-500", ring: "ring-orange-500/30" },
  MARKETING: { bar: "from-pink-500 to-pink-400", pill: "bg-pink-500", ring: "ring-pink-500/30" },
  COGS: { bar: "from-purple-500 to-purple-400", pill: "bg-purple-500", ring: "ring-purple-500/30" },
  SUPPLIES: { bar: "from-emerald-500 to-emerald-400", pill: "bg-emerald-500", ring: "ring-emerald-500/30" },
  TRAVEL: { bar: "from-teal-500 to-teal-400", pill: "bg-teal-500", ring: "ring-teal-500/30" },
  OTHER: { bar: "from-slate-500 to-slate-400", pill: "bg-slate-500", ring: "ring-slate-500/30" },
};

function catColor(c: string) {
  return CATEGORY_HEX[c] ?? CATEGORY_HEX.OTHER;
}

const TR_MONTH_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

export function UpcomingCalendar({
  from,
  items,
}: {
  from: string;
  items: Item[];
}) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const HORIZON_DAYS = 90;
  const end = new Date(start);
  end.setDate(end.getDate() + HORIZON_DAYS);

  // ── Kategori 90g toplam ──
  type CatAgg = { category: string; total: number; count: number };
  const catMap = new Map<string, CatAgg>();
  for (const it of items) {
    const e = catMap.get(it.category) ?? {
      category: it.category,
      total: 0,
      count: 0,
    };
    e.total += it.amount;
    e.count += 1;
    catMap.set(it.category, e);
  }
  const categories = [...catMap.values()].sort((a, b) => b.total - a.total);
  const totalAll = categories.reduce((s, c) => s + c.total, 0);
  const maxCat = Math.max(1, ...categories.map((c) => c.total));

  // ── Ödeme bazlı timeline ──
  type PaymentRow = {
    paymentId: string;
    name: string;
    category: string;
    amountPerOcc: number; // ilk occurrence'tan kabul
    total: number;
    occurrences: { day: number; date: string; amount: number }[];
  };
  const rowMap = new Map<string, PaymentRow>();
  for (const it of items) {
    const d = new Date(it.date);
    const day = Math.floor((d.getTime() - start.getTime()) / 86400_000);
    if (day < 0 || day >= HORIZON_DAYS) continue;
    const row = rowMap.get(it.paymentId) ?? {
      paymentId: it.paymentId,
      name: it.name,
      category: it.category,
      amountPerOcc: it.amount,
      total: 0,
      occurrences: [],
    };
    row.occurrences.push({ day, date: it.date, amount: it.amount });
    row.total += it.amount;
    rowMap.set(it.paymentId, row);
  }
  const rows = [...rowMap.values()].sort((a, b) => b.total - a.total);

  // ── Ay sınırı tick'leri (timeline başlığı) ──
  const monthTicks: { day: number; label: string }[] = [];
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    if (i === 0 || d.getDate() === 1) {
      monthTicks.push({
        day: i,
        label: `${TR_MONTH_SHORT[d.getMonth()]} ${d.getFullYear() % 100}`,
      });
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.015] p-12 text-center">
        <CalendarClock className="mx-auto h-10 w-10 text-[color:var(--color-muted)]" />
        <p className="mt-3 text-sm font-medium">
          Önümüzdeki 90 günde planlı ödeme yok
        </p>
        <p className="mt-1 text-xs text-[color:var(--color-muted)]">
          Aşağıdan ekleyince burada görünür — AI nakit akışı tahmini de bunları
          dikkate alır.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* ─── Sol: Kategori bazında 90g toplam ─── */}
      <div className="lg:col-span-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] overflow-hidden">
        <div className="border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Kategori dağılımı — 90 gün
          </h3>
          <p className="text-[11px] text-[color:var(--color-muted)] mt-0.5">
            Toplam{" "}
            <strong className="font-mono tabular-nums text-[color:var(--color-fg)]">
              {formatMoney(totalAll, "TRY")}
            </strong>{" "}
            kesin çıkış
          </p>
        </div>
        <ul className="divide-y divide-[color:var(--color-border)]">
          {categories.map((c) => {
            const color = catColor(c.category);
            const pct = (c.total / maxCat) * 100;
            const sharePct = (c.total / totalAll) * 100;
            return (
              <li key={c.category} className="px-5 py-3">
                <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", color.pill)} />
                    <span className="font-medium truncate">
                      {EXPENSE_CATEGORY_LABELS[c.category as ExpenseCategoryValue] ??
                        c.category}
                    </span>
                    <span className="shrink-0 text-[10px] text-[color:var(--color-muted)]">
                      {c.count} ödeme
                    </span>
                  </div>
                  <span className="shrink-0 font-mono tabular-nums font-semibold">
                    {formatMoney(c.total, "TRY")}
                  </span>
                </div>
                <div className="relative h-3 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.05] ring-1 ring-inset ring-[color:var(--color-border)]/40">
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r shadow-sm",
                      color.bar,
                    )}
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <div className="mt-1 text-right text-[10px] text-[color:var(--color-muted)] tabular-nums">
                  %{sharePct.toFixed(1)} pay
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* ─── Sağ: 90 gün ödeme timeline'ı ─── */}
      <div className="lg:col-span-7 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/[0.02] to-transparent overflow-hidden">
        <div className="border-b border-indigo-500/15 bg-indigo-500/[0.04] px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-indigo-500" />
            Ödeme takvimi — 90 gün
          </h3>
          <p className="text-[11px] text-[color:var(--color-muted)] mt-0.5">
            Her satır bir ödeme, her nokta bir vade — büyüklük tutarı yansıtır
          </p>
        </div>

        <div className="px-3 sm:px-5 py-4">
          {/* Ay başlıkları (timeline ekseni) */}
          <div className="relative mb-2 ml-[140px] h-4 text-[10px] text-[color:var(--color-muted)]">
            {monthTicks.map((t) => (
              <span
                key={t.day}
                className="absolute select-none whitespace-nowrap font-medium"
                style={{ left: `${(t.day / HORIZON_DAYS) * 100}%` }}
              >
                <span className="absolute -top-0.5 left-0 h-2 w-px bg-[color:var(--color-border)]" />
                <span className="ml-1">{t.label}</span>
              </span>
            ))}
          </div>

          {/* Bugün çizgisi + grid */}
          <div className="space-y-1.5">
            {rows.map((row) => {
              const color = catColor(row.category);
              // En büyük occurrence amount tüm rows içinde — dot boyutu için
              const localMax = Math.max(...row.occurrences.map((o) => o.amount));
              return (
                <div
                  key={row.paymentId}
                  className="group grid grid-cols-[140px_1fr] items-center gap-2 rounded-md py-1.5 transition-colors hover:bg-[color:var(--color-fg)]/[0.02]"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", color.pill)} />
                    <span
                      className="truncate text-[11px] font-medium leading-tight"
                      title={row.name}
                    >
                      {row.name}
                    </span>
                  </div>
                  <div className="relative h-6 rounded bg-[color:var(--color-fg)]/[0.03] ring-1 ring-inset ring-[color:var(--color-border)]/30">
                    {/* day grid: her hafta hafif çizgi */}
                    {[7, 14, 21, 28, 35, 42, 49, 56, 63, 70, 77, 84].map((d) => (
                      <span
                        key={d}
                        className="absolute top-0 bottom-0 w-px bg-[color:var(--color-border)]/30"
                        style={{ left: `${(d / HORIZON_DAYS) * 100}%` }}
                      />
                    ))}
                    {/* her occurrence noktası */}
                    {row.occurrences.map((o, j) => {
                      const sizePct = 0.5 + (o.amount / localMax) * 0.5; // 50-100%
                      return (
                        <span
                          key={j}
                          className={cn(
                            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 transition-transform group-hover:scale-125",
                            color.pill,
                            color.ring,
                          )}
                          style={{
                            left: `${(o.day / HORIZON_DAYS) * 100}%`,
                            height: `${10 + sizePct * 8}px`,
                            width: `${10 + sizePct * 8}px`,
                          }}
                          title={`${new Date(o.date).toLocaleDateString("tr-TR")}: ${formatMoney(o.amount, "TRY")}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer açıklama */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--color-border)] pt-3 text-[10px] text-[color:var(--color-muted)]">
            <span>
              {rows.length} aktif ödeme · {items.length} toplam vade · 90 günlük
              ufuk
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              <span>nokta = ödeme</span>
              <span className="mx-1">·</span>
              <span>büyüklük = tutar</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
