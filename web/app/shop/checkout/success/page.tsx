import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail, Package } from "lucide-react";

import { db } from "@/lib/db";
import { Price } from "../../components/price";

export const metadata = { title: "Sipariş onayı · Pamuk" };
export const dynamic = "force-dynamic";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  const orderNumber = sp.order;

  const order = orderNumber
    ? await db.order.findUnique({
        where: { orderNumber },
        include: {
          items: true,
          customer: { select: { email: true, name: true } },
        },
      })
    : null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
      {/* Hero — yeşil onay */}
      <div className="text-center">
        <span className="inline-grid h-20 w-20 place-items-center rounded-full bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)] ring-1 ring-inset ring-[color:var(--color-accent)]/20">
          <CheckCircle2 className="h-10 w-10" />
        </span>
        <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-accent)]">
          Onaylandı
        </p>
        <h1 className="mt-4 font-display text-5xl italic leading-[0.95] sm:text-6xl">
          Siparişin alındı.
        </h1>
        <p className="mt-5 max-w-md mx-auto text-[15px] text-[color:var(--color-muted)]">
          Onay e-postası birazdan elinde. Sipariş durumun değiştikçe haber
          vereceğiz.
        </p>

        {orderNumber && (
          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-2.5">
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              Sipariş no
            </span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {orderNumber}
            </span>
          </div>
        )}
      </div>

      {/* Order özet */}
      {order && (
        <div className="mt-12 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:p-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--color-border)] pb-4">
            <h2 className="font-display text-2xl italic">Özet</h2>
            <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              {order.items.length} ürün ·{" "}
              {new Date(order.createdAt).toLocaleDateString("tr-TR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          <ul className="mt-4 divide-y divide-[color:var(--color-border)]">
            {order.items.map((it) => (
              <li key={it.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{it.name}</p>
                  <p className="text-[10px] text-[color:var(--color-muted)]">
                    {it.quantity} adet × <Price amount={it.unitPrice} size="sm" />
                  </p>
                </div>
                <div className="font-mono tabular-nums text-sm">
                  <Price amount={it.total} size="sm" />
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[color:var(--color-border)] pt-4 text-sm">
            <div className="flex items-center justify-between text-[color:var(--color-muted)]">
              <dt>Alt toplam</dt>
              <dd><Price amount={order.subtotal} size="sm" /></dd>
            </div>
            <div className="flex items-center justify-between text-[color:var(--color-muted)]">
              <dt>Kargo</dt>
              <dd>
                {order.shipping === 0 ? (
                  <span className="text-[color:var(--color-accent)]">Ücretsiz</span>
                ) : (
                  <Price amount={order.shipping} size="sm" />
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between text-[color:var(--color-muted)]">
              <dt>KDV</dt>
              <dd><Price amount={order.tax} size="sm" /></dd>
            </div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] pt-2 font-semibold">
              <dt>Toplam</dt>
              <dd><Price amount={order.total} size="lg" /></dd>
            </div>
          </dl>

          {order.customer?.email && (
            <p className="mt-6 inline-flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
              <Mail className="h-3 w-3" />
              Onay <strong className="text-[color:var(--color-fg)]">{order.customer.email}</strong> adresine gönderildi.
            </p>
          )}
        </div>
      )}

      {/* CTA'lar */}
      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        <Link
          href={"/shop" as never}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]"
        >
          Alışverişe devam et
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          href={"/shop/account/orders" as never}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3.5 text-sm font-medium transition hover:bg-[color:var(--color-fg)]/[0.04]"
        >
          <Package className="h-4 w-4" />
          Siparişlerim
        </Link>
      </div>
    </div>
  );
}
