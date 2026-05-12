import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { StatusChip } from "../page";

export const metadata = { title: "Siparişlerim · Pamuk" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const customer = await requireCustomer();
  const orders = await db.order.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      currency: true,
      createdAt: true,
      _count: { select: { items: true } },
      items: { select: { name: true }, take: 2 },
    },
  });

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]">
          <Package className="h-7 w-7" />
        </span>
        <p className="mt-5 font-display text-3xl italic">Henüz sipariş yok</p>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          İlk siparişin burada listelenecek.
        </p>
        <Link
          href={"/shop" as never}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
        >
          Alışverişe başla
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <header className="mb-6 flex items-baseline justify-between">
        <h1 className="font-display text-3xl italic">Siparişlerim</h1>
        <span className="text-xs text-[color:var(--color-muted)]">
          {orders.length} sipariş
        </span>
      </header>

      {orders.map((o) => (
        <Link
          key={o.id}
          href={`/shop/account/orders/${o.id}` as never}
          className="block rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-accent)] hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                <StatusChip status={o.status} />
              </div>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                {new Date(o.createdAt).toLocaleDateString("tr-TR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                · {o._count.items} ürün
              </p>
              <p className="mt-1 line-clamp-1 text-xs text-[color:var(--color-muted)]">
                {o.items.map((i) => i.name).join(", ")}
                {o._count.items > 2 && " …"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono tabular-nums text-base font-semibold">
                {formatMoney(o.total, o.currency)}
              </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--color-accent)]">
                Detay
                <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
