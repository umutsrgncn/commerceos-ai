"use client";

import { ArrowRight, Heart, ShoppingBag } from "lucide-react";
import { useCart } from "./cart-store";

export function BuyActions({
  productId,
  outOfStock,
}: {
  productId: string;
  outOfStock: boolean;
}) {
  const { add, pending } = useCart();

  async function addToCart() {
    if (outOfStock || pending) return;
    await add(productId, 1);
  }

  return (
    <div className="mt-6 space-y-2">
      <button
        type="button"
        onClick={addToCart}
        disabled={outOfStock || pending}
        className="group inline-flex w-full items-center justify-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-4 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ShoppingBag className="h-4 w-4" />
        {outOfStock ? "Stokta yok" : pending ? "Ekleniyor…" : "Sepete ekle"}
        {!outOfStock && !pending && (
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          /* TODO Phase 4 wishlist */
        }}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-4 text-sm font-medium transition hover:bg-[color:var(--color-fg)]/[0.04]"
      >
        <Heart className="h-4 w-4" />
        Favorilere ekle
      </button>
    </div>
  );
}
