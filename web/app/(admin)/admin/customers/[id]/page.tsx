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
import { AddressesPanel } from "./components/addresses-panel";

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
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
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

        <div className="space-y-4 lg:col-span-1">
          <Card className="h-fit">
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

          <AddressesPanel
            customerId={customer.id}
            addresses={customer.addresses}
          />
        </div>
      </div>

      {/* Sipariş timeline */}
      <Card>
        <CardHeader className="flex flex-row items-end justify-between gap-3 border-b border-[color:var(--color-border)]">
          <div>
            <CardTitle>Sipariş geçmişi</CardTitle>
            <CardDescription>
              {totalOrders} sipariş
              {totalOrders > 20 && ` — son ${Math.min(20, totalOrders)} gösteriliyor`}
            </CardDescription>
          </div>
          {totalOrders > 0 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
                Toplam ciro
              </div>
              <div className="text-base font-semibold tabular-nums">
                {formatMoney(
                  orders
                    .filter(
                      (o) =>
                        o.status !== "CANCELLED" && o.status !== "REFUNDED",
                    )
                    .reduce((s, o) => s + o.total, 0),
                  customerCurrency,
                )}
              </div>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <ShoppingBag className="h-4 w-4" />
              </span>
              <p className="text-sm text-[color:var(--color-muted)]">
                Henüz sipariş yok.
              </p>
            </div>
          ) : (
            <ol className="relative ml-7 border-l border-[color:var(--color-border)] py-2">
              {orders.map((order) => {
                const dotTone =
                  order.status === "DELIVERED"
                    ? "bg-emerald-500"
                    : order.status === "CANCELLED" ||
                        order.status === "REFUNDED"
                      ? "bg-red-500"
                      : order.status === "SHIPPED"
                        ? "bg-indigo-500"
                        : order.status === "CONFIRMED"
                          ? "bg-fuchsia-500"
                          : "bg-amber-500";
                return (
                  <li key={order.id} className="relative">
                    <span
                      className={cn(
                        "absolute -left-[7px] top-4 grid h-3 w-3 place-items-center rounded-full ring-4 ring-[color:var(--color-bg)]",
                        dotTone,
                      )}
                    />
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="group flex items-center justify-between gap-3 rounded-md px-4 py-3 ml-3 transition hover:bg-[color:var(--color-fg)]/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium group-hover:text-[color:var(--color-accent)]">
                            {order.orderNumber}
                          </span>
                          <Badge variant={statusVariant(order.status)}>
                            {statusLabel(order.status)}
                          </Badge>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[color:var(--color-muted)]">
                          <span>{formatDate(order.createdAt)}</span>
                          <span className="opacity-50">·</span>
                          <span>{formatRelativeTime(order.createdAt)}</span>
                        </div>
                      </div>
                      <span className="shrink-0 text-base font-semibold tabular-nums">
                        {formatMoney(order.total, order.currency)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
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
