import Link from "next/link";
import { Receipt, ShoppingCart, TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import {
  getRevenueTrend,
  getTopProducts,
  getStatusBreakdown,
} from "@/lib/queries/analytics";
import { statusLabel, statusVariant } from "@/lib/orders/workflow";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import { RevenueChart } from "./components/revenue-chart";

export const metadata = { title: "Analitik — CommerceOS" };

const PERIODS = [
  { value: 7, label: "7 gün" },
  { value: 30, label: "30 gün" },
  { value: 90, label: "90 gün" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const params = await searchParams;
  const days = (() => {
    const v = Number(params.days);
    return [7, 30, 90].includes(v) ? v : 30;
  })();

  const [trend, topProducts, statusBreakdown] = await Promise.all([
    getRevenueTrend(days),
    getTopProducts(days, 8),
    getStatusBreakdown(days),
  ]);

  const totalRevenue = trend.reduce((sum, p) => sum + p.total, 0);
  const totalOrders = trend.reduce((sum, p) => sum + p.orders, 0);
  const avgBasket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analitik</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Son {days} günün satış performansı
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
          {PERIODS.map((p) => (
            <Link
              key={p.value}
              href={`/admin/analytics?days=${p.value}`}
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile
          icon={<TrendingUp className="h-5 w-5" />}
          label="Toplam ciro"
          value={formatMoney(totalRevenue, "TRY")}
          hint={`Son ${days} gün`}
          tone="emerald"
        />
        <StatTile
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Sipariş"
          value={String(totalOrders)}
          hint={`Son ${days} gün`}
          tone="indigo"
        />
        <StatTile
          icon={<Receipt className="h-5 w-5" />}
          label="Ortalama sepet"
          value={formatMoney(avgBasket, "TRY")}
          hint={`Sipariş başına ortalama`}
          tone="fuchsia"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Günlük ciro trendi
          </CardTitle>
          <CardDescription>İptal & iade hariç. Hover ile detay.</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={trend} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>En çok satan ürünler</CardTitle>
            <CardDescription>
              Ciro bazında ilk {Math.min(8, topProducts.length)}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
                Bu dönemde satış yok.
              </div>
            ) : (
              (() => {
                const maxRev = Math.max(1, ...topProducts.map((p) => p.revenue));
                return (
                  <ul className="divide-y divide-[color:var(--color-border)]">
                    {topProducts.map((p, i) => {
                      const pct = (p.revenue / maxRev) * 100;
                      const isTop = i === 0;
                      return (
                        <li
                          key={p.productId}
                          className="px-6 py-3 hover:bg-[color:var(--color-fg)]/[0.02]"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={cn(
                                "grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold tabular-nums",
                                isTop
                                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm shadow-amber-500/40"
                                  : i === 1
                                    ? "bg-gradient-to-br from-slate-300 to-slate-400 text-white"
                                    : i === 2
                                      ? "bg-gradient-to-br from-amber-700 to-orange-800 text-white"
                                      : "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]",
                              )}
                            >
                              {i + 1}
                            </span>
                            <Link
                              href={`/admin/products/${p.productId}`}
                              className="flex-1 truncate text-sm font-medium hover:underline"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                              {p.units} adet
                            </span>
                            <span className="w-24 text-right text-sm font-mono tabular-nums font-semibold">
                              {formatMoney(p.revenue, "TRY")}
                            </span>
                          </div>
                          <div className="mt-1.5 ml-10 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.04]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                isTop
                                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                                  : "bg-gradient-to-r from-indigo-400 to-fuchsia-500",
                              )}
                              style={{ width: `${Math.max(3, pct)}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sipariş durum dağılımı</CardTitle>
            <CardDescription>Adet ve ciro</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {statusBreakdown.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
                Bu dönemde sipariş yok.
              </div>
            ) : (
              (() => {
                const totalCount = statusBreakdown.reduce(
                  (s, x) => s + x.count,
                  0,
                );
                return (
                  <ul className="divide-y divide-[color:var(--color-border)]">
                    {statusBreakdown.map((s) => {
                      const pct = totalCount > 0 ? (s.count / totalCount) * 100 : 0;
                      return (
                        <li
                          key={s.status}
                          className="px-6 py-3 hover:bg-[color:var(--color-fg)]/[0.02]"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant={statusVariant(s.status)}>
                              {statusLabel(s.status)}
                            </Badge>
                            <span className="flex-1 text-xs text-[color:var(--color-muted)]">
                              {s.count} sipariş ·{" "}
                              <span className="font-medium text-[color:var(--color-fg)]">
                                %{pct.toFixed(0)}
                              </span>
                            </span>
                            <span className="w-24 text-right text-sm font-mono tabular-nums">
                              {formatMoney(s.revenue, "TRY")}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.04]">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"
                              style={{ width: `${Math.max(3, pct)}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              })()
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
