"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ArrowRight, Eye, Heart, ImageOff, ShoppingBag, X } from "lucide-react";

import { toggleWishlistAction } from "@/lib/shop/wishlist-actions";
import { Price } from "./price";
import { useCart } from "./cart-store";
import { cn } from "@/lib/cn";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishPending, startWish] = useTransition();
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

  function toggleWish() {
    setWished((v) => !v);
    startWish(async () => {
      const r = await toggleWishlistAction(product.id);
      if (r.ok === false) {
        if (r.needsAuth) {
          router.push("/shop/auth/login");
        } else {
          setWished((v) => !v);
        }
      } else {
        setWished(r.active);
      }
    });
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

          {/* Panel — küçük popover modal */}
          <div
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-[color:var(--color-bg)] shadow-2xl sm:m-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Görsel — kare */}
            <div className="relative aspect-square bg-[color:var(--color-fg)]/[0.04]">
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

              {/* Kapat butonu — köşede */}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Kapat"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-bg)]/95 text-[color:var(--color-fg)] backdrop-blur transition hover:bg-[color:var(--color-fg)]/[0.08]"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Favori butonu — köşede */}
              <button
                type="button"
                onClick={toggleWish}
                disabled={wishPending}
                aria-pressed={wished}
                aria-label={wished ? "Favorilerden çıkar" : "Favoriye ekle"}
                className={cn(
                  "absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full backdrop-blur transition",
                  wished
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                    : "bg-[color:var(--color-bg)]/95 text-[color:var(--color-fg)]/70 hover:text-[color:var(--color-accent)]",
                )}
              >
                <Heart
                  className={cn("h-3.5 w-3.5", wished && "fill-current")}
                />
              </button>
            </div>

            {/* Bilgi — minimal */}
            <div className="space-y-4 p-5">
              <div>
                <h2
                  id="qv-title"
                  className="font-display text-xl italic leading-tight line-clamp-2"
                >
                  {product.name}
                </h2>
                <div className="mt-2">
                  <Price
                    amount={product.price}
                    compareAt={product.compareAt}
                    size="lg"
                  />
                </div>
              </div>

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

              <Link
                href={`/shop/p/${product.slug}` as never}
                onClick={() => setOpen(false)}
                className="block text-center text-xs font-medium text-[color:var(--color-accent)] underline-offset-4 hover:underline"
              >
                Tüm detaylar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
