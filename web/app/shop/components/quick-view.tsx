"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, Heart, ImageOff, ShoppingBag, X } from "lucide-react";

import { Price } from "./price";
import { useCart } from "./cart-store";

type QuickViewData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number | null;
  imageUrl?: string | null;
  outOfStock?: boolean;
};

export function QuickViewButton({ product }: { product: QuickViewData }) {
  const [open, setOpen] = useState(false);
  const { add, pending } = useCart();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleAdd() {
    if (product.outOfStock) return;
    await add(product.id, 1);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="pointer-events-auto flex w-full items-center justify-center gap-1.5 rounded-md bg-[color:var(--color-fg)] px-4 py-2.5 text-[11px] font-medium tracking-wide text-[color:var(--color-bg)] shadow-lg transition hover:bg-[color:var(--color-accent)]"
      >
        <Eye className="h-3.5 w-3.5" />
        Hızlı bak
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qv-title"
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setOpen(false)}
          />

          {/* Panel — daha kompakt, mobile'da alt sheet, desktop'ta center */}
          <div
            className="relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-[color:var(--color-bg)] shadow-2xl sm:m-4 sm:max-h-[90vh] sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close — köşede minimal */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-bg)]/95 text-[color:var(--color-muted)] backdrop-blur transition hover:bg-[color:var(--color-fg)]/[0.08] hover:text-[color:var(--color-fg)]"
            >
              <X className="h-4 w-4" />
            </button>

            {/* İçerik — yatay layout, eşit alan paylaşımı */}
            <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr]">
              {/* Görsel — sade kare */}
              <div className="relative aspect-square bg-[color:var(--color-fg)]/[0.04] sm:aspect-auto sm:h-full">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[color:var(--color-muted)]">
                    <ImageOff className="h-10 w-10 opacity-40" />
                  </div>
                )}
                {product.outOfStock && (
                  <div className="absolute inset-0 grid place-items-center bg-[color:var(--color-bg)]/70 backdrop-blur-[2px]">
                    <span className="rounded-full bg-[color:var(--color-fg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--color-bg)]">
                      Tükendi
                    </span>
                  </div>
                )}
              </div>

              {/* Bilgi + aksiyon — sade dikey akış */}
              <div className="flex flex-col gap-5 p-6 sm:p-7">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                    Hızlı bakış
                  </p>
                  <h2
                    id="qv-title"
                    className="mt-2 font-display text-2xl italic leading-tight sm:text-3xl"
                  >
                    {product.name}
                  </h2>
                </div>

                <div>
                  <Price
                    amount={product.price}
                    compareAt={product.compareAt}
                    size="lg"
                  />
                  <p className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                    KDV dahil · 750 ₺ üzeri ücretsiz kargo
                  </p>
                </div>

                {/* Sade garanti satırları */}
                <ul className="space-y-1 text-[11px] text-[color:var(--color-muted)]">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
                    2-3 iş gününde kargo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
                    14 gün ücretsiz iade
                  </li>
                </ul>

                {/* Aksiyon grubu */}
                <div className="mt-auto flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={product.outOfStock || pending}
                    onClick={handleAdd}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-5 py-3 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {product.outOfStock
                      ? "Stokta yok"
                      : pending
                        ? "Ekleniyor…"
                        : "Sepete ekle"}
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
                    >
                      <Heart className="h-3.5 w-3.5" />
                      Favorile
                    </button>
                    <Link
                      href={`/shop/p/${product.slug}` as never}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[color:var(--color-accent)] hover:gap-2 transition-all"
                    >
                      Tam detay
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
