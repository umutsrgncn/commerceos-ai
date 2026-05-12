import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  Package,
  Truck,
} from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import { ShopImage } from "../../../components/shop-image";
import { StatusChip } from "../../page";
import { CopyButton } from "./components/copy-button";

const CARRIER_META: Record<
  string,
  { label: string; trackUrl: (n: string) => string }
> = {
  ARAS: {
    label: "Aras Kargo",
    trackUrl: (n) => `https://www.araskargo.com.tr/?TrackingNumber=${n}`,
  },
  YURTICI: {
    label: "Yurtiçi Kargo",
    trackUrl: (n) =>
      `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${n}`,
  },
  MNG: {
    label: "MNG Kargo",
    trackUrl: (n) => `https://kargotakip.mngkargo.com.tr/?refNo=${n}`,
  },
  PTT: {
    label: "PTT Kargo",
    trackUrl: (n) => `https://gonderitakip.ptt.gov.tr/Track?q=${n}`,
  },
  OTHER: {
    label: "Kargo",
    trackUrl: () => "#",
  },
};

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

      {/* Kargo takip — durum'a göre dolu / boş */}
      <TrackingSection order={order} />
    </div>
  );
}

function TrackingSection({
  order,
}: {
  order: {
    status: string;
    carrier: string | null;
    trackingNumber: string | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    createdAt: Date;
  };
}) {
  const carrierMeta = order.carrier
    ? (CARRIER_META[order.carrier] ?? CARRIER_META.OTHER)
    : null;

  const stages = [
    {
      key: "CONFIRMED",
      label: "Sipariş onaylandı",
      done:
        order.status === "CONFIRMED" ||
        order.status === "SHIPPED" ||
        order.status === "DELIVERED",
      date: order.createdAt,
    },
    {
      key: "SHIPPED",
      label: "Kargoya verildi",
      done: order.status === "SHIPPED" || order.status === "DELIVERED",
      date: order.shippedAt,
    },
    {
      key: "DELIVERED",
      label: "Teslim edildi",
      done: order.status === "DELIVERED",
      date: order.deliveredAt,
    },
  ];

  return (
    <section className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        <Truck className="h-3.5 w-3.5" />
        Kargo takibi
      </h2>

      {/* Takip no kartı — varsa */}
      {order.trackingNumber && carrierMeta && (
        <div className="mt-4 grid gap-4 rounded-xl border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent)]/[0.04] p-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              {carrierMeta.label}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="font-mono text-lg font-semibold tabular-nums">
                {order.trackingNumber}
              </span>
              <CopyButton value={order.trackingNumber} />
            </div>
          </div>
          <a
            href={carrierMeta.trackUrl(order.trackingNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[color:var(--color-accent)] px-4 py-2.5 text-xs font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110"
          >
            {carrierMeta.label}'da takip et
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Aşamalar — vertical timeline */}
      <ol className="mt-6 space-y-0">
        {stages.map((s, i) => {
          const isLast = i === stages.length - 1;
          return (
            <li key={s.key} className="relative flex gap-4 pb-6 last:pb-0">
              {/* vertical line */}
              {!isLast && (
                <span
                  className={`absolute left-3 top-7 bottom-0 w-px ${
                    s.done && stages[i + 1].done
                      ? "bg-[color:var(--color-accent)]"
                      : "bg-[color:var(--color-border)]"
                  }`}
                />
              )}
              {/* dot */}
              <span
                className={`relative grid h-6 w-6 shrink-0 place-items-center rounded-full ${
                  s.done
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                    : "bg-[color:var(--color-fg)]/[0.06] text-[color:var(--color-muted)]"
                }`}
              >
                {s.done ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${
                    s.done ? "" : "text-[color:var(--color-muted)]"
                  }`}
                >
                  {s.label}
                </p>
                {s.date && (
                  <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]">
                    {new Date(s.date).toLocaleString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
                {!s.done && (
                  <p className="mt-0.5 text-[11px] text-[color:var(--color-muted)]/70 italic">
                    {s.key === "SHIPPED" && "Hazırlanıyor"}
                    {s.key === "DELIVERED" && "Bekleniyor"}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!order.trackingNumber && order.status !== "DELIVERED" && (
        <p className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/[0.05] p-3 text-[11px] text-[color:var(--color-muted)]">
          {order.status === "CANCELLED" ? (
            <>Sipariş iptal edildi.</>
          ) : (
            <>
              Henüz kargoya verilmedi. Kargo numarası burada görünecek ve sana
              e-posta gönderilecek.
            </>
          )}
        </p>
      )}
    </section>
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
