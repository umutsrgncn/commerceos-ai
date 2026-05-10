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
        <h1 className="text-2xl font-semibold tracking-tight">
          Hoş geldin, {name}.
        </h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Bugünün özeti — sayılar son 24 saatlik dilimden.
        </p>
      </div>

      <AnomalyBanner />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Bugünkü ciro"
          value={formatMoney(stats.revenueToday.total, stats.revenueToday.currency)}
          hint="İptal/iade hariç"
        />
        <StatCard
          icon={<ShoppingCart className="h-4 w-4" />}
          label="Bugünkü sipariş"
          value={String(stats.ordersToday)}
          hint="İptal hariç"
        />
        <StatCard
          icon={<Users className="h-4 w-4" />}
          label="Yeni müşteri"
          value={String(stats.newCustomersThisWeek)}
          hint="Bu hafta"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Stok uyarısı"
          value={String(stats.lowStockCount)}
          hint="Yayında & düşük"
          accent={stats.lowStockCount > 0 ? "danger" : "muted"}
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
              <table className="w-full text-sm">
                <tbody>
                  {recent.map((o) => (
                    <tr
                      key={o.id}
                      className="border-t border-[color:var(--color-border)] hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-6 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono text-xs font-medium hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[color:var(--color-muted)]">
                        {o.customer.name}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatMoney(o.total, o.currency)}
                      </td>
                      <td className="px-6 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(o.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

function StatCard({
  icon,
  label,
  value,
  hint,
  accent = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  accent?: "muted" | "danger";
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-xs uppercase tracking-wider">
            {label}
          </CardDescription>
          <span
            className={
              accent === "danger"
                ? "rounded-md bg-red-500/10 p-1.5 text-red-500"
                : "rounded-md bg-[color:var(--color-fg)]/[0.05] p-1.5 text-[color:var(--color-muted)]"
            }
          >
            {icon}
          </span>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 text-xs text-[color:var(--color-muted)]">
        {hint}
      </CardContent>
    </Card>
  );
}
