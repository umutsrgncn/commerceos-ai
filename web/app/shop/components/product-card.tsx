import Link from "next/link";
import { cn } from "@/lib/cn";
import { Price } from "./price";
import { ShopImage } from "./shop-image";
import { WishlistButton } from "./wishlist-button";
import { QuickViewButton } from "./quick-view";

export type ShopProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAt?: number | null;
  imageUrl?: string | null;
  badges?: Array<{ label: string; tone?: "accent" | "warn" | "muted" }>;
  outOfStock?: boolean;
};

export function ProductCard({
  product,
  priority = false,
}: {
  product: ShopProductCardData;
  priority?: boolean;
}) {
  return (
    <article className="group relative">
      {/* Görsel — aspect 4:5. Link sadece görsel + bilgiyi sarar; quick-view ayrı interactive. */}
      <div className="relative">
        <Link
          href={`/shop/p/${product.slug}` as never}
          aria-label={product.name}
          className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/40"
        >
          <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-[color:var(--color-fg)]/[0.04]">
            <ShopImage
              src={product.imageUrl ?? null}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              priority={priority}
            />

            {/* Badge'ler — sol üst */}
            {product.badges && product.badges.length > 0 && (
              <div className="absolute left-3 top-3 flex flex-col gap-1">
                {product.badges.map((b, i) => (
                  <span
                    key={i}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide backdrop-blur",
                      b.tone === "accent"
                        ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                        : b.tone === "warn"
                          ? "bg-[color:var(--color-warn)]/90 text-white"
                          : "bg-[color:var(--color-surface)]/90 text-[color:var(--color-fg)]",
                    )}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            )}

            {/* Tükendi overlay */}
            {product.outOfStock && (
              <div className="absolute inset-0 grid place-items-center bg-[color:var(--color-bg)]/70 backdrop-blur-[2px]">
                <span className="rounded-full bg-[color:var(--color-fg)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[color:var(--color-bg)]">
                  Tükendi
                </span>
              </div>
            )}
          </div>
        </Link>

        {/* "Hızlı bak" — Link DIŞINDA, alt sınırdan hover'da yükselir */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <QuickViewButton product={product} />
        </div>

        {/* Favori — sağ üst */}
        <WishlistButton
          productId={product.id}
          className="absolute right-3 top-3 opacity-0 group-hover:opacity-100"
        />
      </div>

      {/* Bilgi — Link altında, ayrı tıklanabilir */}
      <Link
        href={`/shop/p/${product.slug}` as never}
        className="mt-3 block space-y-1 focus:outline-none"
      >
        <h3 className="text-sm font-medium leading-snug hover:underline underline-offset-4">
          {product.name}
        </h3>
        <Price amount={product.price} compareAt={product.compareAt} size="sm" />
      </Link>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] rounded-md bg-[color:var(--color-fg)]/[0.05]" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-3/4 rounded bg-[color:var(--color-fg)]/[0.06]" />
        <div className="h-3 w-1/3 rounded bg-[color:var(--color-fg)]/[0.06]" />
      </div>
    </div>
  );
}
