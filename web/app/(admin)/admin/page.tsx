import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ShoppingCart,
  TrendingUp,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatTile } from "@/components/ui/stat-tile";
import {
  getDashboardStats,
  getRecentOrders,
} from "@/lib/queries/dashboard";
import { listLowStock } from "@/lib/queries/inventory";
import {
  currentPeriod,
  getCurrentMonthRevenue,
  getGoal,
} from "@/lib/queries/goals";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { InsightsPanel } from "@/components/dashboard/insights-panel";
import { GoalWidget } from "@/components/dashboard/goal-widget";
import { AnomalyBanner } from "@/components/dashboard/anomaly-banner";
import { OrderStatusBadge } from "./orders/components/order-status-badge";

export const metadata = { title: "Dashboard — CommerceOS" };

const TR_MONTH = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
];

export default async function DashboardPage() {
  const period = currentPeriod();
  const now = new Date();
  const periodLabel = `${TR_MONTH[now.getMonth()]} ${now.getFullYear()}`;

  const [session, stats, recent, lowStock, goal, monthRevenue] = await Promise.all([
    auth(),
    getDashboardStats(),
    getRecentOrders(8),
    listLowStock(6),
    getGoal(period),
    getCurrentMonthRevenue(),
  ]);

  const name = session?.user?.name?.split(" ")[0] ?? "yönetici";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
          Hoş geldin, {name}.
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Bugünün özeti — sayılar son 24 saatlik dilimden.
        </p>
      </div>

      <AnomalyBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<TrendingUp className="h-5 w-5" />}
          label="Bugünkü ciro"
          value={formatMoney(stats.revenueToday.total, stats.revenueToday.currency)}
          hint="İptal/iade hariç"
          tone="emerald"
        />
        <StatTile
          icon={<ShoppingCart className="h-5 w-5" />}
          label="Bugünkü sipariş"
          value={String(stats.ordersToday)}
          hint="İptal hariç"
          tone="indigo"
        />
        <StatTile
          icon={<Users className="h-5 w-5" />}
          label="Yeni müşteri"
          value={String(stats.newCustomersThisWeek)}
          hint="Bu hafta"
          tone="fuchsia"
        />
        <StatTile
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Stok uyarısı"
          value={String(stats.lowStockCount)}
          hint="Yayında & düşük"
          tone={stats.lowStockCount > 0 ? "red" : "amber"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Son siparişler</CardTitle>
              <CardDescription>En yeni 8 sipariş</CardDescription>
            </div>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            >
              Tümünü gör <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
                Henüz sipariş yok.
              </div>
            ) : (
              <ul className="divide-y divide-[color:var(--color-border)]">
                {recent.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center gap-2 px-3 py-3 sm:px-4 hover:bg-[color:var(--color-fg)]/[0.025]"
                  >
                    {/* Sol: order no + müşteri */}
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-medium hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                      <div className="truncate text-xs text-[color:var(--color-muted)]">
                        {o.customer.name}
                        <span className="hidden sm:inline">
                          {" · "}
                          {formatRelativeTime(o.createdAt)}
                        </span>
                      </div>
                    </div>
                    {/* Sağ: durum + tutar */}
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoney(o.total, o.currency)}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Stok uyarıları</CardTitle>
              <CardDescription>Eşik altındaki ürünler</CardDescription>
            </div>
            <Link
              href="/admin/inventory?low=1"
              className="inline-flex items-center gap-1 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            >
              Hepsi <ArrowUpRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-[color:var(--color-muted)]">
                Tüm ürünler eşiğin üzerinde 🎉
              </p>
            ) : (
              <ul className="divide-y divide-[color:var(--color-border)]">
                {lowStock.map((item) => (
                  <li key={item.id} className="flex items-center justify-between py-3 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${item.id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {item.name}
                      </Link>
                      <span className="font-mono text-xs text-[color:var(--color-muted)]">
                        {item.sku}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold tabular-nums">
                        {item.quantity}
                      </div>
                      <div className="text-xs text-[color:var(--color-muted)]">
                        eşik {item.reorderLevel}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GoalWidget
          period={period}
          periodLabel={periodLabel}
          currentRevenue={monthRevenue}
          goal={
            goal
              ? { targetAmount: goal.targetAmount, notes: goal.notes }
              : null
          }
        />
        <InsightsPanel />
      </div>
    </div>
  );
}

