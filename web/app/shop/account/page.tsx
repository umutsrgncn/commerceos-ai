import Link from "next/link";
import { ArrowRight, Heart, MapPin, Package } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";

export const metadata = { title: "Hesabım · Pamuk" };
export const dynamic = "force-dynamic";

export default async function AccountHomePage() {
  const customer = await requireCustomer();

  const [orderCount, addressCount, wishlistCount, lastOrder] = await Promise.all([
    db.order.count({ where: { customerId: customer.id } }),
    db.customerAddress.count({ where: { customerId: customer.id } }),
    db.wishlist.count({ where: { customerId: customer.id } }),
    db.order.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        items: { select: { name: true }, take: 3 },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* 3 stat card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          href="/shop/account/orders"
          icon={<Package className="h-5 w-5" />}
          label="Toplam sipariş"
          value={orderCount}
          tone="accent"
        />
        <StatCard
          href="/shop/account/addresses"
          icon={<MapPin className="h-5 w-5" />}
          label="Adres"
          value={addressCount}
          tone="muted"
        />
        <StatCard
          href="/shop/account/wishlist"
          icon={<Heart className="h-5 w-5" />}
          label="Favori"
          value={wishlistCount}
          tone="muted"
        />
      </div>

      {/* Son sipariş */}
      {lastOrder && (
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl italic">Son siparişin</h2>
            <Link
              href={"/shop/account/orders" as never}
              className="text-xs text-[color:var(--color-muted)] underline-offset-2 hover:underline"
            >
              Tümü →
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold">{lastOrder.orderNumber}</p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                {new Date(lastOrder.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {lastOrder.items.length} ürün
              </p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)] line-clamp-1">
                {lastOrder.items.map((i) => i.name).join(", ")}
              </p>
            </div>
            <div className="text-right">
              <StatusChip status={lastOrder.status} />
              <p className="mt-1 font-mono tabular-nums text-base font-semibold">
                {formatMoney(lastOrder.total, "TRY")}
              </p>
            </div>
            <Link
              href={`/shop/account/orders/${lastOrder.id}` as never}
              className="inline-flex items-center gap-1.5 rounded-md bg-[color:var(--color-fg)] px-4 py-2 text-xs font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
            >
              Detay
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </section>
      )}

      {!lastOrder && (
        <section className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-12 text-center">
          <p className="font-display text-2xl italic text-[color:var(--color-muted)]">
            Henüz sipariş yok.
          </p>
          <Link
            href={"/shop" as never}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-5 py-2.5 text-xs font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
          >
            Alışverişe başla
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </section>
      )}
    </div>
  );
}

const STATUS_LABEL: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Bekliyor", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-400" },
  CONFIRMED: { label: "Onaylandı", tone: "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]" },
  SHIPPED: { label: "Kargoda", tone: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  DELIVERED: { label: "Teslim edildi", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" },
  CANCELLED: { label: "İptal", tone: "bg-red-500/15 text-red-500" },
  REFUNDED: { label: "İade edildi", tone: "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-muted)]" },
};

export function StatusChip({ status }: { status: string }) {
  const meta = STATUS_LABEL[status] ?? { label: status, tone: "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-muted)]" };
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.tone}`}>
      {meta.label}
    </span>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "accent" | "muted";
}) {
  return (
    <Link
      href={href as never}
      className="group relative overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--color-accent)] hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <span
          className={`grid h-10 w-10 place-items-center rounded-lg ${
            tone === "accent"
              ? "bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]"
              : "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]"
          }`}
        >
          {icon}
        </span>
        <ArrowRight className="h-4 w-4 text-[color:var(--color-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[color:var(--color-accent)]" />
      </div>
      <p className="mt-4 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">{value}</p>
    </Link>
  );
}
