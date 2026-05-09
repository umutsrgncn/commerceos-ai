import Link from "next/link";
import { TrendingUp } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Analitik</h1>
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
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Toplam ciro
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatMoney(totalRevenue, "TRY")}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Sipariş
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{totalOrders}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider">
              Ortalama sepet
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {formatMoney(avgBasket, "TRY")}
            </CardTitle>
          </CardHeader>
        </Card>
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
            <CardDescription>Ciro bazında ilk 8</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {topProducts.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
                Bu dönemde satış yok.
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--color-border)]">
                {topProducts.map((p, i) => (
                  <li
                    key={p.productId}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-xs font-mono">
                      {i + 1}
                    </span>
                    <Link
                      href={`/admin/products/${p.productId}`}
                      className="flex-1 truncate text-sm font-medium hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="text-xs text-[color:var(--color-muted)]">
                      {p.units} adet
                    </span>
                    <span className="w-24 text-right text-sm tabular-nums font-medium">
                      {formatMoney(p.revenue, "TRY")}
                    </span>
                  </li>
                ))}
              </ul>
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
              <ul className="divide-y divide-[color:var(--color-border)]">
                {statusBreakdown.map((s) => (
                  <li
                    key={s.status}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <Badge variant={statusVariant(s.status)}>
                      {statusLabel(s.status)}
                    </Badge>
                    <span className="flex-1 text-sm text-[color:var(--color-muted)]">
                      {s.count} sipariş
                    </span>
                    <span className="w-24 text-right text-sm tabular-nums">
                      {formatMoney(s.revenue, "TRY")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
