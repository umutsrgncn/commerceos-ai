"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { useCart } from "./cart-store";
import { Price } from "./price";
import { ShopImage } from "./shop-image";
import { cn } from "@/lib/cn";

export function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, update, remove, pending } = useCart();

  // ESC kapanış + scroll lock — restore her zaman "" (çift modal etkisini kır)
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeDrawer();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={closeDrawer}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Drawer panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col bg-[color:var(--color-bg)] shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-border)] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-[color:var(--color-accent)]/15 text-[color:var(--color-accent)]">
              <ShoppingBag className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Sepetin</h2>
              <p className="text-[11px] text-[color:var(--color-muted)]">
                {cart.itemCount > 0
                  ? `${cart.itemCount} ürün`
                  : "Henüz boş"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Kapat"
            className="grid h-8 w-8 place-items-center rounded-md hover:bg-[color:var(--color-fg)]/[0.05]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto">
          {cart.items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.04] text-[color:var(--color-muted)]">
                <ShoppingBag className="h-6 w-6" />
              </span>
              <p className="mt-4 text-sm font-medium">Sepetin henüz boş</p>
              <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                Beğendiğin ürünleri sepete ekleyince burada görünür.
              </p>
              <Link
                href={"/shop" as never}
                onClick={closeDrawer}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-[color:var(--color-fg)] px-5 py-2.5 text-xs font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
              >
                Alışverişe başla
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {cart.items.map((it) => (
                <li key={it.id} className="flex gap-3 p-5">
                  <Link
                    href={`/shop/p/${it.slug}` as never}
                    onClick={closeDrawer}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]"
                  >
                    <ShopImage
                      src={it.imageUrl}
                      alt={it.name}
                      className="absolute inset-0 h-full w-full object-cover"
                      sizes="80px"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/shop/p/${it.slug}` as never}
                        onClick={closeDrawer}
                        className="text-sm font-medium hover:underline underline-offset-4 line-clamp-2"
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
                    <div className="flex items-center justify-between gap-2">
                      <QtyStepper
                        value={it.quantity}
                        max={it.stockQuantity}
                        onChange={(v) => update(it.id, v)}
                        disabled={pending}
                      />
                      <button
                        type="button"
                        onClick={() => remove(it.id)}
                        aria-label="Sepetten çıkar"
                        className="grid h-7 w-7 place-items-center rounded-md text-[color:var(--color-muted)] hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="font-mono tabular-nums text-sm font-semibold shrink-0">
                    {new Intl.NumberFormat("tr-TR", {
                      style: "currency",
                      currency: "TRY",
                      maximumFractionDigits: 0,
                    }).format((it.price * it.quantity) / 100)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {cart.items.length > 0 && (
          <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[color:var(--color-muted)]">Alt toplam</span>
              <Price amount={cart.subtotal} size="lg" className="font-semibold" />
            </div>
            <p className="text-[10px] text-[color:var(--color-muted)]">
              Kargo ve vergi sonraki adımda hesaplanır.
            </p>
            <Link
              href={"/shop/checkout" as never}
              onClick={closeDrawer}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]",
                pending && "pointer-events-none opacity-70",
              )}
            >
              Ödemeye geç
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={"/shop/cart" as never}
              onClick={closeDrawer}
              className="block text-center text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] underline-offset-4 hover:underline"
            >
              Sepetin tam görünümü
            </Link>
          </div>
        )}
      </div>
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
    <div className="inline-flex items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, value - 1))}
        disabled={disabled || value <= 1}
        className="grid h-7 w-7 place-items-center text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-30"
        aria-label="Azalt"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="min-w-[2ch] text-center text-xs font-mono tabular-nums">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max || value + 1, value + 1))}
        disabled={disabled || (max > 0 && value >= max)}
        className="grid h-7 w-7 place-items-center text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] disabled:opacity-30"
        aria-label="Artır"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}
