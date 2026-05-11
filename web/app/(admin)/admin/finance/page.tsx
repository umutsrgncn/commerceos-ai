import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BrainCircuit,
  CalendarClock,
  Coins,
  LineChart,
  PieChart,
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

const CATEGORY_TONES: Record<string, string> = {
  PAYROLL: "from-fuchsia-500 to-fuchsia-400",
  RENT: "from-red-500 to-red-400",
  TAXES: "from-amber-500 to-amber-400",
  UTILITIES: "from-sky-500 to-sky-400",
  SOFTWARE: "from-indigo-500 to-indigo-400",
  SHIPPING: "from-orange-500 to-orange-400",
  MARKETING: "from-pink-500 to-pink-400",
  COGS: "from-purple-500 to-purple-400",
  SUPPLIES: "from-emerald-500 to-emerald-400",
  TRAVEL: "from-teal-500 to-teal-400",
  OTHER: "from-slate-500 to-slate-400",
};

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

  const profitable = pl.netProfit >= 0;

  return (
    <div className="space-y-8">
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-emerald-500/[0.04] via-indigo-500/[0.03] to-fuchsia-500/[0.02] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-xl ring-1 ring-inset",
                profitable
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20"
                  : "bg-red-500/15 text-red-500 ring-red-500/20",
              )}
            >
              {profitable ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
            </span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Finans
              </h1>
              <p className="mt-0.5 max-w-md text-sm text-[color:var(--color-muted)]">
                Son {days} günün kâr/zarar, nakit akışı, gider dağılımı ve AI
                öneri panelleri.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                {profitable ? "Net Kâr" : "Net Zarar"}
              </div>
              <div
                className={cn(
                  "mt-0.5 text-2xl font-bold tabular-nums tracking-tight",
                  profitable
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {formatMoney(Math.abs(pl.netProfit), "TRY")}
              </div>
              {pl.revenueNet > 0 && (
                <div className="text-[10px] text-[color:var(--color-muted)]">
                  Marj %{((pl.netProfit / pl.revenueNet) * 100).toFixed(1)}
                </div>
              )}
            </div>

            <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-bg)] p-1">
              {PERIODS.map((p) => (
                <Link
                  key={p.value}
                  href={`/admin/finance?days=${p.value}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition",
                    days === p.value
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]",
                  )}
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── KPI TILES ─────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={<ArrowUp className="h-5 w-5" />}
          label="Net Gelir"
          value={formatMoney(pl.revenueNet, "TRY")}
          hint={`Brüt ${formatMoney(pl.revenueGross, "TRY")} − iade`}
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
            profitable ? (
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
          tone={profitable ? "emerald" : "red"}
          highlight
        />
      </div>

      {/* ─────────── SECTION 1: TARİHSEL ─────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<LineChart className="h-4 w-4" />}
          title="Tarihsel görünüm"
          subtitle={`Son ${days} günün nakit akışı ve gider dağılımı`}
          tone="indigo"
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-4 w-4 text-indigo-500" />
                Nakit akışı
              </CardTitle>
              <CardDescription>
                <span className="inline-flex items-center gap-1 mr-2">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500" /> gelir
                </span>
                <span className="inline-flex items-center gap-1 mr-2">
                  <span className="h-2 w-2 rounded-sm bg-red-500" /> gider
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="h-px w-3 border-t-2 border-dashed border-indigo-500" />{" "}
                  net
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CashflowChart data={cashflow} />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-fuchsia-500" />
                Gider dağılımı
              </CardTitle>
              <CardDescription>
                Toplam {formatMoney(pl.expenseTotal, "TRY")}
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
                  items={pl.byCategory.sort((a, b) => b.amount - a.amount).slice(0, 6)}
                  total={pl.expenseTotal}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─────────── SECTION 2: GELECEK ─────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<CalendarClock className="h-4 w-4" />}
          title="Yaklaşan ödemeler"
          subtitle="Maaş, kira, vergi, abonelik — kesin nakit çıkışları"
          tone="amber"
          action={
            <Link
              href="/admin/finance/scheduled"
              className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-1.5 text-xs font-medium hover:bg-[color:var(--color-fg)]/[0.04]"
            >
              Tümünü yönet
              <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />

        <Card>
          <CardHeader className="border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02]">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <CardTitle className="text-sm">Önümüzdeki 30 gün</CardTitle>
              <span className="text-xs text-[color:var(--color-muted)]">
                {upcomingNext30.length} ödeme
              </span>
              <span className="ml-auto text-lg font-mono tabular-nums font-semibold text-red-600 dark:text-red-400">
                −{formatMoney(upcomingTotalMinor, "TRY")}
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingNext30.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-[color:var(--color-muted)]">
                Bu ay için planlı ödeme yok.{" "}
                <Link
                  href="/admin/finance/scheduled#new-payment"
                  className="font-medium text-[color:var(--color-fg)] underline"
                >
                  Şimdi ekle
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--color-border)]">
                {upcomingNext30.slice(0, 6).map((o) => (
                  <li
                    key={`${o.paymentId}-${o.date.toISOString()}`}
                    className="grid grid-cols-12 items-center gap-3 px-5 py-2.5 text-xs hover:bg-[color:var(--color-fg)]/[0.02]"
                  >
                    <span className="col-span-3 sm:col-span-2 inline-flex items-center justify-center rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono tabular-nums text-amber-700 dark:text-amber-400">
                      {o.date.toLocaleDateString("tr-TR", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                    <span className="col-span-6 sm:col-span-6 truncate font-medium">
                      {o.name}
                    </span>
                    <span className="hidden sm:inline col-span-2 truncate text-[10px] text-[color:var(--color-muted)]">
                      {EXPENSE_CATEGORY_LABELS[o.category as ExpenseCategoryValue]}
                    </span>
                    <span className="col-span-3 sm:col-span-2 text-right font-mono tabular-nums">
                      {formatMoney(o.amount, "TRY")}
                    </span>
                  </li>
                ))}
                {upcomingNext30.length > 6 && (
                  <li className="px-5 py-2 text-center">
                    <Link
                      href="/admin/finance/scheduled"
                      className="text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
                    >
                      +{upcomingNext30.length - 6} daha — tümünü görüntüle →
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ─────────── SECTION 3: AI ─────────── */}
      <section className="space-y-4">
        <SectionHeader
          icon={<BrainCircuit className="h-4 w-4" />}
          title="AI analiz"
          subtitle="Veri tabanlı plan, tahmin ve içgörü"
          tone="fuchsia"
        />

        <TurnaroundPanel />
        <CashflowForecast />
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
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  subtitle,
  tone,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tone: "indigo" | "fuchsia" | "amber" | "emerald";
  action?: React.ReactNode;
}) {
  const toneClass = {
    indigo: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 ring-indigo-500/20",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400 ring-fuchsia-500/20",
    amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-amber-500/20",
    emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20",
  }[tone];
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-[color:var(--color-border)] pb-2">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg ring-1 ring-inset", toneClass)}>
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-[11px] text-[color:var(--color-muted)]">{subtitle}</p>
        </div>
      </div>
      {action}
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
        const grad = CATEGORY_TONES[item.category] ?? CATEGORY_TONES.OTHER;
        return (
          <li key={item.category} className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate font-medium">
                {EXPENSE_CATEGORY_LABELS[item.category]}
                <span className="ml-1 text-[10px] text-[color:var(--color-muted)]">
                  ({item.count})
                </span>
              </span>
              <span className="shrink-0 font-mono tabular-nums">
                {formatMoney(item.amount, "TRY")}
                <span className="ml-1.5 text-[10px] text-[color:var(--color-muted)]">
                  %{pct.toFixed(0)}
                </span>
              </span>
            </div>
            <div className="relative h-2 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.05]">
              <div
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
                  grad,
                )}
                style={{ width: `${Math.max(2, pct)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
