"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";

export function WishlistButton({
  productId: _productId,
  className,
}: {
  productId: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="Favoriye ekle"
      onClick={(e) => {
        e.preventDefault();
        // TODO Phase 4 wishlist server action
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-surface)]/85 text-[color:var(--color-fg)]/70 backdrop-blur transition hover:text-[color:var(--color-accent)]",
        className,
      )}
    >
      <Heart className="h-3.5 w-3.5" />
    </button>
  );
}
