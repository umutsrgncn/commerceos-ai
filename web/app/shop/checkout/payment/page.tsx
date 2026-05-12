import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";

import { readCart } from "@/lib/shop/cart";
import { getPendingCheckout } from "@/lib/shop/checkout";
import { Price } from "../../components/price";
import { ShopImage } from "../../components/shop-image";
import { MockPosForm } from "./components/mock-pos-form";

export const metadata = { title: "Ödeme · Pamuk" };
export const dynamic = "force-dynamic";

const SHIPPING_THRESHOLD = 75000;
const SHIPPING_COSTS = { standard: 4990, express: 9990 };

export default async function PaymentPage() {
  const cart = await readCart();
  const pending = await getPendingCheckout();

  if (cart.items.length === 0) redirect("/shop/cart");
  if (!pending) redirect("/shop/checkout");

  const shipping =
    cart.subtotal >= SHIPPING_THRESHOLD
      ? 0
      : SHIPPING_COSTS[pending.shippingMethod];
  const tax = Math.round(cart.subtotal * 0.2);
  const total = cart.subtotal + shipping + tax;

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Link
        href={"/shop/checkout" as never}
        className="mb-8 inline-flex items-center gap-1.5 text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> Adres bilgisini düzenle
      </Link>

      <header className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          Adım 2 / 2 · Ödeme
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
          Kart bilgisi
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          <strong className="text-[color:var(--color-fg)]">Demo POS</strong> —
          gerçek ödeme alınmaz. Test kart bilgilerini aşağıdaki kart örneğine
          dokunarak otomatik doldurabilirsin.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-7">
          <MockPosForm total={total} />
        </div>

        {/* Sağ — sipariş + adres özeti */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-5">
          {/* Adres özeti */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
            <div className="flex items-start justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
                Teslimat
              </h3>
              <Link
                href={"/shop/checkout" as never}
                className="text-[11px] text-[color:var(--color-accent)] underline-offset-2 hover:underline"
              >
                Değiştir
              </Link>
            </div>
            <p className="mt-3 text-sm font-medium">{pending.fullName}</p>
            <p className="mt-1 text-xs text-[color:var(--color-muted)] leading-relaxed">
              {pending.line1}
              {pending.district && <>, {pending.district}</>}
              <br />
              {pending.city}
              {pending.postalCode && <> · {pending.postalCode}</>}
            </p>
            <p className="mt-2 text-[11px] text-[color:var(--color-muted)]">
              {pending.email} · {pending.phone}
            </p>
            <p className="mt-3 inline-block rounded-full bg-[color:var(--color-accent)]/10 px-2.5 py-0.5 text-[10px] font-medium text-[color:var(--color-accent)]">
              {pending.shippingMethod === "express"
                ? "Ekspres · 1 gün"
                : "Standart · 2-3 gün"}
            </p>
          </div>

          {/* Ürünler + özet */}
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
              Siparişin · {cart.itemCount} ürün
            </h3>
            <ul className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {cart.items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
                    <ShopImage
                      src={it.imageUrl}
                      alt={it.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="56px"
                    />
                    <span className="absolute -top-1 -right-1 grid h-4 min-w-[16px] place-items-center rounded-full bg-[color:var(--color-fg)] px-1 text-[9px] font-bold text-[color:var(--color-bg)] ring-2 ring-[color:var(--color-surface)]">
                      {it.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium line-clamp-2">
                      {it.name}
                    </p>
                    <Price
                      amount={it.price * it.quantity}
                      size="sm"
                      className="mt-0.5"
                    />
                  </div>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2 border-t border-[color:var(--color-border)] pt-3 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[color:var(--color-muted)]">Alt toplam</dt>
                <dd className="font-mono tabular-nums">
                  <Price amount={cart.subtotal} size="sm" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[color:var(--color-muted)]">KDV (%20)</dt>
                <dd className="font-mono tabular-nums">
                  <Price amount={tax} size="sm" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[color:var(--color-muted)]">Kargo</dt>
                <dd className="font-mono tabular-nums">
                  {shipping === 0 ? (
                    <span className="text-[color:var(--color-accent)] font-medium">
                      Ücretsiz
                    </span>
                  ) : (
                    <Price amount={shipping} size="sm" />
                  )}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-[color:var(--color-border)] pt-2 font-semibold">
                <dt>Toplam</dt>
                <dd className="font-mono tabular-nums">
                  <Price amount={total} size="lg" />
                </dd>
              </div>
            </dl>
            <ul className="mt-4 space-y-1.5 border-t border-[color:var(--color-border)] pt-3 text-[10px] text-[color:var(--color-muted)]">
              <li className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-[color:var(--color-accent)]" />
                Mock POS · şifrelenmiş kart akışı simülasyonu
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-[color:var(--color-accent)]" />
                Test sipariş — gerçek ödeme yok
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
