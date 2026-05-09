import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Phone,
  ShoppingBag,
  Trash2,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCustomerById } from "@/lib/queries/customers";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { formatMoney, formatDate, formatRelativeTime } from "@/lib/format";
import { statusLabel, statusVariant } from "@/lib/orders/workflow";
import { cn } from "@/lib/cn";
import { CustomerForm } from "../components/customer-form";
import { SegmentPanel } from "../components/segment-panel";

export const metadata = { title: "Müşteri — CommerceOS" };

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  // Aggregate values from order history (snapshot — yeniden sorgulamaktansa
  // `customer.orders`'ı kullan, getCustomerById zaten son 20'yi getiriyor).
  const orders = customer.orders;
  const totalOrders = orders.length;
  const validOrders = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "REFUNDED"
  );
  const lifetimeValue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const avgBasket = validOrders.length > 0 ? Math.round(lifetimeValue / validOrders.length) : 0;
  const lastOrder = orders[0]; // queries already sort by createdAt desc
  const customerCurrency = orders[0]?.currency ?? "TRY";

  const initials = customer.name
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const address = customer.address as Address;
  const addressLine = address
    ? [address.line1, address.city, address.country].filter(Boolean).join(", ")
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/customers"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Müşteriler
        </Link>

        <form action={deleteCustomerAction}>
          <input type="hidden" name="id" value={customer.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      {/* Hero kartı: avatar + ad + iletişim çipleri */}
      <Card className="overflow-hidden">
        <div className="relative h-24 bg-gradient-to-br from-indigo-500/20 via-fuchsia-500/15 to-emerald-500/10" />
        <CardContent className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <span className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl border-4 border-[color:var(--color-bg)] bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-2xl font-semibold text-white shadow-lg">
            {initials}
          </span>
          <div className="flex-1 sm:pb-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {customer.name}
            </h1>
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-[color:var(--color-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {customer.email}
              </span>
              {customer.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {customer.phone}
                </span>
              )}
              {addressLine && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {addressLine}
                </span>
              )}
              <span className="text-xs">
                Eklendi: {formatDate(customer.createdAt)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat tile'lar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Toplam sipariş"
          value={String(totalOrders)}
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Yaşam boyu değer"
          value={formatMoney(lifetimeValue, customerCurrency)}
          tone="success"
        />
        <StatTile
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Ortalama sepet"
          value={
            avgBasket > 0
              ? formatMoney(avgBasket, customerCurrency)
              : "—"
          }
        />
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Son sipariş"
          value={
            lastOrder ? formatRelativeTime(lastOrder.createdAt) : "—"
          }
        />
      </div>

      {/* Orta blok: 2 col → form ve sağda AI segment */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerForm
            mode="edit"
            customer={{
              id: customer.id,
              name: customer.name,
              email: customer.email,
              phone: customer.phone,
              notes: customer.notes,
              address: address,
            }}
          />
        </div>

        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">AI ile segmentasyon</CardTitle>
            <CardDescription>
              Sipariş geçmişine bakıp segment + aksiyon önerir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SegmentPanel customerId={customer.id} />
          </CardContent>
        </Card>
      </div>

      {/* Sipariş timeline */}
      <Card>
        <CardHeader className="border-b border-[color:var(--color-border)]">
          <CardTitle>Sipariş geçmişi</CardTitle>
          <CardDescription>
            {totalOrders} sipariş — son {Math.min(20, totalOrders)} gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]">
              Henüz sipariş yok.
            </div>
          ) : (
            <ul className="relative ml-6 border-l border-[color:var(--color-border)]">
              {orders.map((order) => (
                <li key={order.id} className="relative py-4">
                  <span
                    className={cn(
                      "absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full ring-2 ring-[color:var(--color-bg)]",
                      order.status === "DELIVERED"
                        ? "bg-emerald-500"
                        : order.status === "CANCELLED" ||
                            order.status === "REFUNDED"
                          ? "bg-red-500"
                          : "bg-indigo-500"
                    )}
                  />
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="block pl-6 transition hover:bg-[color:var(--color-fg)]/[0.025] rounded-r-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">
                            {order.orderNumber}
                          </span>
                          <Badge variant={statusVariant(order.status)}>
                            {statusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                          {formatDate(order.createdAt)} · {formatRelativeTime(order.createdAt)}
                        </div>
                      </div>
                      <span className="text-base font-semibold tabular-nums">
                        {formatMoney(order.total, order.currency)}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "muted" | "success";
}) {
  const toneClass =
    tone === "success"
      ? "bg-emerald-500/10 text-emerald-500"
      : "bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneClass)}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
            {label}
          </div>
          <div className="text-lg font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
