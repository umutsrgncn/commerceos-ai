"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Heart, ShoppingBag } from "lucide-react";

import { toggleWishlistAction } from "@/lib/shop/wishlist-actions";
import { useCart } from "./cart-store";
import { cn } from "@/lib/cn";

export function BuyActions({
  productId,
  outOfStock,
  initialWishlisted = false,
}: {
  productId: string;
  outOfStock: boolean;
  initialWishlisted?: boolean;
}) {
  const router = useRouter();
  const { add, pending } = useCart();
  const [wished, setWished] = useState(initialWishlisted);
  const [wishPending, startWish] = useTransition();

  async function addToCart() {
    if (outOfStock || pending) return;
    await add(productId, 1);
  }

  function toggleWish(e: React.MouseEvent) {
    e.preventDefault();
    setWished((v) => !v);
    startWish(async () => {
      const r = await toggleWishlistAction(productId);
      if (r.ok === false) {
        if (r.needsAuth) {
          router.push(
            `/shop/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
          );
        } else {
          setWished((v) => !v); // revert
        }
      } else {
        setWished(r.active);
      }
    });
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
        onClick={toggleWish}
        disabled={wishPending}
        aria-pressed={wished}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-md border px-6 py-4 text-sm font-medium transition",
          wished
            ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]"
            : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-[color:var(--color-fg)]/[0.04]",
        )}
      >
        <Heart className={cn("h-4 w-4", wished && "fill-current")} />
        {wished ? "Favorilerimde" : "Favorilere ekle"}
      </button>
    </div>
  );
}
