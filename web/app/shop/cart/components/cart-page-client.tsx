"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, Trash2 } from "lucide-react";

import { useCart, type CartState } from "../../components/cart-store";
import { Price } from "../../components/price";
import { ShopImage } from "../../components/shop-image";

const SHIPPING_THRESHOLD = 75000; // 750 ₺
const SHIPPING_COST = 4990; // 49,90 ₺

export function CartPageClient({ initial }: { initial: CartState }) {
  const { cart, update, remove, pending, clear } = useCart();
  // Server'dan initial geliyor, useCart hydrate olunca onun state'i devralır
  const display = cart.items.length > 0 ? cart : initial;

  const shipping = display.subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total = display.subtotal + shipping;
  const toFreeShipping = Math.max(0, SHIPPING_THRESHOLD - display.subtotal);

  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
      {/* Sol — items */}
      <div className="lg:col-span-7">
        {/* Free shipping bar */}
        {toFreeShipping > 0 ? (
          <div className="mb-6 rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent-soft)] px-4 py-3">
            <p className="text-xs text-[color:var(--color-fg)]">
              <strong>{(toFreeShipping / 100).toLocaleString("tr-TR")} ₺</strong>{" "}
              daha ekle, kargo bedava!
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.06]">
              <div
                className="h-full rounded-full bg-[color:var(--color-accent)] transition-all"
                style={{
                  width: `${Math.min(100, (display.subtotal / SHIPPING_THRESHOLD) * 100)}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-[color:var(--color-accent)]/30 bg-[color:var(--color-accent-soft)] px-4 py-3 text-xs">
            <strong className="text-[color:var(--color-accent)]">
              Tebrikler!
            </strong>{" "}
            Kargo bedava 🎉
          </div>
        )}

        <ul className="divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
          {display.items.map((it) => (
            <li key={it.id} className="grid grid-cols-12 gap-4 py-5">
              <Link
                href={`/shop/p/${it.slug}` as never}
                className="relative col-span-3 sm:col-span-2 aspect-[4/5] overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]"
              >
                <ShopImage
                  src={it.imageUrl}
                  alt={it.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  sizes="120px"
                />
              </Link>
              <div className="col-span-9 sm:col-span-10 flex flex-col justify-between">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/shop/p/${it.slug}` as never}
                      className="text-base font-medium hover:underline underline-offset-4"
                    >
                      {it.name}
                    </Link>
                    <div className="mt-1">
                      <Price amount={it.price} size="sm" />
                    </div>
                    {!it.inStock && (
                      <p className="mt-1 text-[10px] text-red-500">
                        Stok yetersiz
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono tabular-nums text-base font-semibold">
                      {new Intl.NumberFormat("tr-TR", {
                        style: "currency",
                        currency: "TRY",
                        maximumFractionDigits: 0,
                      }).format((it.price * it.quantity) / 100)}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(it.id)}
                      className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--color-muted)] hover:text-red-500"
                    >
                      <Trash2 className="h-3 w-3" />
                      Sil
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <QtyStepper
                    value={it.quantity}
                    max={it.stockQuantity}
                    onChange={(v) => update(it.id, v)}
                    disabled={pending}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>

        {display.items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Sepeti tamamen boşaltmak istiyor musun?")) clear();
            }}
            className="mt-6 inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-red-500 underline-offset-4 hover:underline"
          >
            <Trash2 className="h-3 w-3" />
            Sepeti boşalt
          </button>
        )}
      </div>

      {/* Sağ — özet (sticky) */}
      <aside className="lg:col-span-5 lg:sticky lg:top-28 self-start">
        <div className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
          <h2 className="font-display text-2xl italic">Özet</h2>

          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-[color:var(--color-muted)]">Alt toplam</dt>
              <dd className="font-mono tabular-nums">
                <Price amount={display.subtotal} size="md" />
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
                  <Price amount={shipping} size="md" />
                )}
              </dd>
            </div>
            <div className="flex items-center justify-between border-t border-[color:var(--color-border)] pt-3">
              <dt className="font-semibold">Toplam</dt>
              <dd className="font-mono tabular-nums font-semibold">
                <Price amount={total} size="lg" />
              </dd>
            </div>
          </dl>

          <Link
            href={"/shop/checkout" as never}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]"
          >
            Ödemeye geç
            <ArrowRight className="h-4 w-4" />
          </Link>

          <ul className="mt-6 space-y-1.5 border-t border-[color:var(--color-border)] pt-4 text-[11px] text-[color:var(--color-muted)]">
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
              SSL şifreli güvenli ödeme
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
              14 gün ücretsiz iade
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
              2-3 iş gününde kargo
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function QtyStepper({
  value,
  max,
  onChange,
  disabled,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="grid h-9 w-9 place-items-center text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-30"
        aria-label="Azalt"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-[3ch] text-center text-sm font-mono tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max || value + 1, value + 1))}
        disabled={disabled || (max > 0 && value >= max)}
        className="grid h-9 w-9 place-items-center text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-30"
        aria-label="Artır"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
