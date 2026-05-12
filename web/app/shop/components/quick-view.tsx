"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Eye,
  Heart,
  ImageOff,
  ShoppingBag,
  X,
} from "lucide-react";

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

  // ESC ile kapan + scroll lock — restore her zaman "" (çift modal etkisini kır)
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function handleAdd() {
    if (product.outOfStock) return;
    await add(product.id, 1);
    setOpen(false); // cart drawer otomatik açılır
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
        className="pointer-events-auto flex items-center justify-between gap-2 rounded-md bg-[color:var(--color-fg)] px-4 py-2.5 text-[color:var(--color-bg)] shadow-lg transition hover:bg-[color:var(--color-accent)]"
      >
        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide">
          <Eye className="h-3.5 w-3.5" />
          Hızlı bak
        </span>
        <span className="text-xs">→</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="qv-title"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={(e) => {
            // Backdrop tıklaması — sadece doğrudan bu div'e ise kapat
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          {/* Backdrop */}
          <div
            aria-hidden
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl shadow-black/30"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Kapat butonu */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="absolute right-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="grid gap-0 sm:grid-cols-2">
              {/* Sol — görsel (basit <img>, next/image değil) */}
              <div className="relative aspect-[4/5] bg-[color:var(--color-fg)]/[0.05]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-[color:var(--color-muted)]">
                    <ImageOff className="h-8 w-8 opacity-40" />
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

              {/* Sağ — bilgi + aksiyonlar */}
              <div className="flex flex-col p-6 sm:p-8">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                  Hızlı bakış
                </p>
                <h2
                  id="qv-title"
                  className="mt-3 font-display text-3xl italic leading-tight"
                >
                  {product.name}
                </h2>

                <div className="mt-5">
                  <Price
                    amount={product.price}
                    compareAt={product.compareAt}
                    size="xl"
                  />
                  <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                    KDV dahil
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <button
                    type="button"
                    disabled={product.outOfStock || pending}
                    onClick={handleAdd}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    {product.outOfStock
                      ? "Stokta yok"
                      : pending
                        ? "Ekleniyor…"
                        : "Sepete ekle"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3 text-sm font-medium transition hover:bg-[color:var(--color-fg)]/[0.04]"
                  >
                    <Heart className="h-4 w-4" />
                    Favorilere ekle
                  </button>
                </div>

                <ul className="mt-6 space-y-1.5 border-t border-[color:var(--color-border)] pt-4 text-[11px] text-[color:var(--color-muted)]">
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
                    2-3 iş gününde kargo
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
                    14 gün ücretsiz iade
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[color:var(--color-accent)]" />
                    100% organik pamuk
                  </li>
                </ul>

                <Link
                  href={`/shop/p/${product.slug}` as never}
                  onClick={() => setOpen(false)}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-accent)] hover:gap-3 transition-all"
                >
                  Tam ürün sayfasını gör
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
