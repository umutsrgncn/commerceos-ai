import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Package, Truck } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ShopImage } from "../../../components/shop-image";
import { StatusChip } from "../../page";

export const metadata = { title: "Sipariş detayı · Pamuk" };
export const dynamic = "force-dynamic";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await requireCustomer();

  const order = await db.order.findFirst({
    where: { id, customerId: customer.id },
    include: {
      items: {
        include: {
          product: { select: { slug: true, images: true } },
        },
      },
    },
  });
  if (!order) notFound();

  const address = order.shippingAddress as {
    fullName?: string;
    phone?: string;
    line1?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  } | null;

  function firstImage(images: unknown): string | null {
    if (Array.isArray(images) && images[0]) {
      const f = images[0];
      if (typeof f === "string") return f;
      if (f && typeof f === "object" && "url" in f)
        return String((f as { url: unknown }).url);
    }
    return null;
  }

  return (
    <div className="space-y-6">
      <Link
        href={"/shop/account/orders" as never}
        className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> Siparişler
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            Sipariş
          </p>
          <h1 className="mt-2 font-mono text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            {new Date(order.createdAt).toLocaleString("tr-TR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <StatusChip status={order.status} />
      </header>

      {/* Items */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
        <h2 className="border-b border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          Ürünler · {order.items.length}
        </h2>
        <ul className="divide-y divide-[color:var(--color-border)]">
          {order.items.map((it) => {
            const img = firstImage(it.product.images);
            return (
              <li key={it.id} className="flex items-center gap-4 px-6 py-4">
                <Link
                  href={`/shop/p/${it.product.slug}` as never}
                  className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]"
                >
                  <ShopImage
                    src={img}
                    alt={it.name}
                    className="absolute inset-0 h-full w-full object-cover"
                    sizes="64px"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/shop/p/${it.product.slug}` as never}
                    className="text-sm font-medium hover:underline underline-offset-4"
                  >
                    {it.name}
                  </Link>
                  <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
                    {it.quantity} adet × {formatMoney(it.unitPrice, "TRY")}
                  </p>
                </div>
                <p className="font-mono tabular-nums text-sm font-semibold shrink-0">
                  {formatMoney(it.total, "TRY")}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Adres */}
        {address && (
          <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 lg:col-span-7">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
              <MapPin className="h-3.5 w-3.5" />
              Teslimat adresi
            </h2>
            <p className="mt-3 text-sm font-medium">{address.fullName}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)] leading-relaxed">
              {address.line1}
              {address.district && <>, {address.district}</>}
              <br />
              {address.city}
              {address.postalCode && <> · {address.postalCode}</>}
            </p>
            <p className="mt-2 text-[11px] text-[color:var(--color-muted)]">
              {address.phone}
            </p>
          </section>
        )}

        {/* Toplam */}
        <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 lg:col-span-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
            Toplam
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Alt toplam" value={formatMoney(order.subtotal, order.currency)} />
            <Row label="Kargo" value={order.shipping === 0 ? "Ücretsiz" : formatMoney(order.shipping, order.currency)} />
            <Row label="KDV" value={formatMoney(order.tax, order.currency)} />
            <div className="border-t border-[color:var(--color-border)] pt-2 flex items-center justify-between font-semibold">
              <dt>Tutar</dt>
              <dd className="font-mono tabular-nums">
                {formatMoney(order.total, order.currency)}
              </dd>
            </div>
          </dl>
          {order.notes && (
            <p className="mt-3 text-[10px] text-[color:var(--color-muted)]">
              {order.notes}
            </p>
          )}
        </section>
      </div>

      {/* Track placeholder */}
      <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
          <Truck className="h-3.5 w-3.5" />
          Kargo takip
        </h2>
        <p className="mt-3 text-xs text-[color:var(--color-muted)]">
          Kargo durum güncellemelerini buradan ve e-postanla takip
          edebilirsin. {order.status === "PENDING" || order.status === "CONFIRMED" ? (
            <>Henüz kargoya verilmedi.</>
          ) : (
            <>Detay için kargo firmasının takip sayfasını kullan.</>
          )}
        </p>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[color:var(--color-muted)]">
      <dt>{label}</dt>
      <dd className="font-mono tabular-nums">{value}</dd>
    </div>
  );
}
