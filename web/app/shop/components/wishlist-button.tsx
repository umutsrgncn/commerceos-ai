"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Heart } from "lucide-react";

import { toggleWishlistAction } from "@/lib/shop/wishlist-actions";
import { cn } from "@/lib/cn";

export function WishlistButton({
  productId,
  initialActive = false,
  className,
}: {
  productId: string;
  initialActive?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [active, setActive] = useState(initialActive);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    // Optimistic
    setActive((v) => !v);
    start(async () => {
      const r = await toggleWishlistAction(productId);
      if (r.ok === false) {
        if (r.needsAuth) {
          router.push(
            `/shop/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
          );
        } else {
          // Revert
          setActive((v) => !v);
        }
      } else {
        setActive(r.active);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={active ? "Favorilerden çıkar" : "Favoriye ekle"}
      aria-pressed={active}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full backdrop-blur transition disabled:cursor-wait",
        active
          ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
          : "bg-[color:var(--color-bg)]/85 text-[color:var(--color-fg)]/70 hover:text-[color:var(--color-accent)]",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-3.5 w-3.5",
          active && "fill-current",
        )}
      />
    </button>
  );
}
