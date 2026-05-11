import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarClock,
  Coins,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCashFlow, getProfitLoss } from "@/lib/queries/finance";
import {
  currentPeriod,
  getCurrentMonthRevenue,
  getGoal,
} from "@/lib/queries/goals";
import { listUpcomingOccurrences } from "@/lib/queries/scheduled-payments";
import { StatTile } from "@/components/ui/stat-tile";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryValue,
} from "@/lib/schemas/expenses";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { CashflowChart } from "./components/cashflow-chart";
import { CashflowForecast } from "./components/cashflow-forecast";
import { FinanceAiPanel } from "./components/finance-ai-panel";
import { TurnaroundPanel } from "./components/turnaround-panel";

export const metadata = { title: "Finans — CommerceOS" };

const PERIODS = [
  { value: 7, label: "7 gün" },
  { value: 30, label: "30 gün" },
  { value: 90, label: "90 gün" },
];

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = (() => {
    const v = Number(params.days);
    return [7, 30, 90].includes(v) ? v : 30;
  })();

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);

  const next30From = new Date();
  const next30To = new Date();
  next30To.setDate(next30To.getDate() + 30);

  const [pl, cashflow, currentGoal, currentMonthRev, upcomingNext30] =
    await Promise.all([
      getProfitLoss(from, to),
      getCashFlow(days),
      getGoal(currentPeriod()),
      getCurrentMonthRevenue(),
      listUpcomingOccurrences(next30From, next30To),
    ]);

  const upcomingTotalMinor = upcomingNext30.reduce((s, o) => s + o.amount, 0);

  const goalProgressPct = currentGoal
    ? Math.min(100, (currentMonthRev / currentGoal.targetAmount) * 100)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Finans</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Son {days} günün kâr/zarar tablosu, gider dağılımı, nakit akışı
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/finance?days=${p.value}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                days === p.value
                  ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* P&L stat tile'ları */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<ArrowUp className="h-5 w-5" />}
          label="Net Gelir"
          value={formatMoney(pl.revenueNet, "TRY")}
          hint={`Brüt ${formatMoney(pl.revenueGross, "TRY")} − iade ${formatMoney(pl.refunds, "TRY")}`}
          tone="emerald"
        />
        <StatTile
          icon={<ArrowDown className="h-5 w-5" />}
          label="Gider"
          value={formatMoney(pl.expenseTotal, "TRY")}
          hint={`${pl.byCategory.length} kategoride`}
          tone="red"
        />
        <StatTile
          icon={<Coins className="h-5 w-5" />}
          label="İade"
          value={formatMoney(pl.refunds, "TRY")}
          hint="Pending + completed"
          tone="amber"
        />
        <StatTile
          icon={
            pl.netProfit >= 0 ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )
          }
          label="Net Kâr"
          value={formatMoney(pl.netProfit, "TRY")}
          hint={
            pl.revenueNet > 0
              ? `Marj %${((pl.netProfit / pl.revenueNet) * 100).toFixed(1)}`
              : "—"
          }
          tone={pl.netProfit >= 0 ? "emerald" : "red"}
          highlight
        />
      </div>

      {/* Cash flow chart */}
      <Card>
        <CardHeader>
          <CardTitle>Nakit akışı</CardTitle>
          <CardDescription>
            Günlük gelir + gider + net (yeşil alan = gelir, kırmızı bar = gider,
            mavi kesik çizgi = net)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CashflowChart data={cashflow} />
        </CardContent>
      </Card>

      {/* Kategori bazında gider */}
      <Card>
        <CardHeader>
          <CardTitle>Gider dağılımı</CardTitle>
          <CardDescription>
            Kategori bazında — toplam {formatMoney(pl.expenseTotal, "TRY")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pl.byCategory.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <Wallet className="h-4 w-4" />
              </span>
              <p className="text-sm text-[color:var(--color-muted)]">
                Bu dönemde gider yok.
              </p>
              <Link
                href="/admin/expenses/new"
                className="text-xs text-[color:var(--color-accent)] hover:underline"
              >
                İlk gideri ekle →
              </Link>
            </div>
          ) : (
            <CategoryBars
              items={pl.byCategory.sort((a, b) => b.amount - a.amount)}
              total={pl.expenseTotal}
            />
          )}
        </CardContent>
      </Card>

      {/* Gelecek ödemeler özet kartı */}
      <Card className="border-indigo-500/30 bg-indigo-500/[0.03]">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-indigo-500" />
              Önümüzdeki 30 gün — kesin çıkışlar
            </CardTitle>
            <CardDescription>
              Maaş, kira, vergi, abonelik — {upcomingNext30.length} ödeme,
              toplam{" "}
              <strong className="text-[color:var(--color-fg)]">
                {formatMoney(upcomingTotalMinor, "TRY")}
              </strong>
            </CardDescription>
          </div>
          <Link
            href="/admin/finance/scheduled"
            className="inline-flex items-center gap-1 self-start rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--color-fg)]/[0.04]"
          >
            Tümünü yönet
            <ArrowRight className="h-3 w-3" />
          </Link>
        </CardHeader>
        <CardContent>
          {upcomingNext30.length === 0 ? (
            <p className="text-xs text-[color:var(--color-muted)]">
              Bu ay için planlı ödeme tanımlanmamış.{" "}
              <Link
                href="/admin/finance/scheduled"
                className="underline hover:text-[color:var(--color-fg)]"
              >
                Şimdi ekle
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-1.5">
              {upcomingNext30.slice(0, 6).map((o) => (
                <li
                  key={`${o.paymentId}-${o.date.toISOString()}`}
                  className="grid grid-cols-12 items-center gap-2 text-xs"
                >
                  <span className="col-span-2 font-mono tabular-nums text-[10px] text-[color:var(--color-muted)]">
                    {o.date.toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="col-span-6 truncate">{o.name}</span>
                  <span className="col-span-2 truncate text-[10px] text-[color:var(--color-muted)]">
                    {EXPENSE_CATEGORY_LABELS[o.category as ExpenseCategoryValue]}
                  </span>
                  <span className="col-span-2 text-right font-mono tabular-nums">
                    {formatMoney(o.amount, "TRY")}
                  </span>
                </li>
              ))}
              {upcomingNext30.length > 6 && (
                <li className="text-[10px] text-[color:var(--color-muted)] pt-1">
                  +{upcomingNext30.length - 6} daha…
                </li>
              )}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* AI Turnaround Plan (3 ay) — grafiksel kanıt */}
      <TurnaroundPanel />

      {/* AI Cash flow forecast (önümüzdeki 30 gün) */}
      <CashflowForecast />

      {/* AI Finansal İçgörü */}
      <FinanceAiPanel
        periodLabel={`Son ${days} gün`}
        revenueNetMinor={pl.revenueNet}
        expenseTotalMinor={pl.expenseTotal}
        netProfitMinor={pl.netProfit}
        byCategory={pl.byCategory.map((b) => ({
          category: b.category,
          amount: b.amount,
          count: b.count,
        }))}
        goalTargetMinor={currentGoal?.targetAmount ?? null}
        goalProgressPct={goalProgressPct}
      />
    </div>
  );
}

function CategoryBars({
  items,
  total,
}: {
  items: Array<{ category: ExpenseCategoryValue; amount: number; count: number }>;
  total: number;
}) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const pct = total > 0 ? (item.amount / total) * 100 : 0;
        return (
          <li key={item.category} className="flex items-center gap-3 text-xs">
            <span className="w-44 shrink-0 truncate">
              {EXPENSE_CATEGORY_LABELS[item.category]}
              <span className="ml-1 text-[10px] text-[color:var(--color-muted)]">
                ({item.count})
              </span>
            </span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-red-500 to-orange-500"
                style={{ width: `${Math.max(pct, 1)}%` }}
              />
            </div>
            <span className="w-24 shrink-0 text-right font-mono tabular-nums">
              {formatMoney(item.amount, "TRY")}
            </span>
            <span className="w-12 shrink-0 text-right text-[10px] text-[color:var(--color-muted)]">
              %{pct.toFixed(0)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
