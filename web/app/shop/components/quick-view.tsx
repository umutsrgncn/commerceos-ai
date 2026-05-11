"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, Heart, ShoppingBag } from "lucide-react";

import { Modal } from "@/components/ui/modal";
import { Price } from "./price";
import { ShopImage } from "./shop-image";

type QuickViewData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number | null;
  imageUrl?: string | null;
  outOfStock?: boolean;
};

export function QuickViewButton({
  product,
}: {
  product: QuickViewData;
}) {
  const [open, setOpen] = useState(false);

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

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={product.name}
        description="Hızlı bakış"
        icon={<Eye className="h-5 w-5" />}
        tone="indigo"
        size="lg"
      >
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Sol — büyük görsel */}
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
            <ShopImage
              src={product.imageUrl ?? null}
              alt={product.name}
              priority
              className="absolute inset-0 h-full w-full object-cover"
              sizes="(max-width: 640px) 100vw, 480px"
            />
            {product.outOfStock && (
              <div className="absolute inset-0 grid place-items-center bg-[color:var(--color-bg)]/70 backdrop-blur-[2px]">
                <span className="rounded-full bg-[color:var(--color-fg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--color-bg)]">
                  Tükendi
                </span>
              </div>
            )}
          </div>

          {/* Sağ — bilgi + aksiyonlar */}
          <div className="flex flex-col">
            <h3 className="font-display text-3xl italic leading-tight">
              {product.name}
            </h3>

            <div className="mt-4">
              <Price
                amount={product.price}
                compareAt={product.compareAt}
                size="xl"
              />
              <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                KDV dahil
              </p>
            </div>

            {/* CTA'lar */}
            <div className="mt-6 space-y-2">
              <button
                type="button"
                disabled={product.outOfStock}
                onClick={() => {
                  // TODO Phase 2 — cart server action
                  setOpen(false);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                {product.outOfStock ? "Stokta yok" : "Sepete ekle"}
              </button>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3 text-sm font-medium transition hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                <Heart className="h-4 w-4" />
                Favorilere ekle
              </button>
            </div>

            {/* Garantiler — kısa */}
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

            {/* Tam detay link */}
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
      </Modal>
    </>
  );
}
