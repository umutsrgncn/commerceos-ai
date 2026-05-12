import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Lock, ShieldCheck, Truck } from "lucide-react";

import { readCart } from "@/lib/shop/cart";
import { CheckoutForm } from "./components/checkout-form";
import { Price } from "../components/price";
import { ShopImage } from "../components/shop-image";

export const metadata = { title: "Ödeme · Pamuk" };
export const dynamic = "force-dynamic";

const SHIPPING_THRESHOLD = 75000;
const SHIPPING_COSTS = { standard: 4990, express: 9990 };

export default async function CheckoutPage() {
  const cart = await readCart();
  if (cart.items.length === 0) {
    redirect("/shop/cart");
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      <Link
        href={"/shop/cart" as never}
        className="mb-8 inline-flex items-center gap-1.5 text-[11px] text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="h-3 w-3" /> Sepete dön
      </Link>

      <header className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          Adım 1 / 1 · Bilgi
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
          Ödeme
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-muted)]">
          Hesap oluşturmana gerek yok. Bilgilerini gir, sipariş tamamlansın.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Sol — form */}
        <div className="lg:col-span-7">
          <CheckoutForm
            subtotal={cart.subtotal}
            shippingThreshold={SHIPPING_THRESHOLD}
            shippingCosts={SHIPPING_COSTS}
          />
        </div>

        {/* Sağ — order summary (sticky) */}
        <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start">
          <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 space-y-5">
            <h2 className="font-display text-2xl italic">Siparişin</h2>

            <ul className="space-y-3 max-h-80 overflow-y-auto">
              {cart.items.map((it) => (
                <li key={it.id} className="flex gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
                    <ShopImage
                      src={it.imageUrl}
                      alt={it.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="64px"
                    />
                    <span className="absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-[color:var(--color-fg)] px-1 text-[10px] font-bold text-[color:var(--color-bg)] ring-2 ring-[color:var(--color-surface)]">
                      {it.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2">{it.name}</p>
                    <Price amount={it.price * it.quantity} size="sm" className="mt-1" />
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-[color:var(--color-border)] pt-4 text-xs">
              <div className="flex items-center justify-between">
                <dt className="text-[color:var(--color-muted)]">Alt toplam</dt>
                <dd className="font-mono tabular-nums">
                  <Price amount={cart.subtotal} size="sm" />
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-[color:var(--color-muted)]">KDV (%20)</dt>
                <dd className="font-mono tabular-nums">
                  <Price amount={Math.round(cart.subtotal * 0.2)} size="sm" />
                </dd>
              </div>
              <div className="flex items-center justify-between text-[color:var(--color-muted)]">
                <dt>Kargo</dt>
                <dd className="text-[10px] italic">sonraki adımda</dd>
              </div>
            </dl>

            <ul className="space-y-2 border-t border-[color:var(--color-border)] pt-4 text-[10px] text-[color:var(--color-muted)]">
              <li className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-[color:var(--color-accent)]" />
                SSL şifreli ödeme · iyzico
              </li>
              <li className="flex items-center gap-2">
                <Truck className="h-3 w-3 text-[color:var(--color-accent)]" />
                2-3 iş günü içinde kargoda
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-[color:var(--color-accent)]" />
                14 gün ücretsiz iade
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
