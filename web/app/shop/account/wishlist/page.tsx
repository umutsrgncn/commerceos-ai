import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";

import { requireCustomer } from "@/lib/shop/auth";
import { db } from "@/lib/db";
import { ProductCard } from "../../components/product-card";

export const metadata = { title: "Favorilerim · Pamuk" };
export const dynamic = "force-dynamic";

function firstImage(images: unknown): string | null {
  if (Array.isArray(images) && images[0]) {
    const f = images[0];
    if (typeof f === "string") return f;
    if (f && typeof f === "object" && "url" in f)
      return String((f as { url: unknown }).url);
  }
  return null;
}

export default async function WishlistPage() {
  const customer = await requireCustomer();
  const items = await db.wishlist.findMany({
    where: { customerId: customer.id },
    orderBy: { addedAt: "desc" },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          price: true,
          images: true,
          status: true,
          inventory: { select: { quantity: true } },
        },
      },
    },
  });
  const active = items.filter((w) => w.product.status === "PUBLISHED");

  if (active.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--color-border)] p-16 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
          <Heart className="h-7 w-7" />
        </span>
        <p className="mt-5 font-display text-3xl italic">Favori listende boş</p>
        <p className="mt-2 text-sm text-[color:var(--color-muted)]">
          Sevdiğin ürünleri kalp ikonuyla işaretle, burada listele.
        </p>
        <Link
          href={"/shop" as never}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
        >
          Alışverişe başla
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-baseline justify-between">
        <h1 className="font-display text-3xl italic">Favorilerim</h1>
        <span className="text-xs text-[color:var(--color-muted)]">
          {active.length} ürün
        </span>
      </header>

      <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6">
        {active.map((w) => (
          <ProductCard
            key={w.id}
            product={{
              id: w.product.id,
              slug: w.product.slug,
              name: w.product.name,
              price: w.product.price,
              compareAt: null,
              imageUrl: firstImage(w.product.images),
              outOfStock: (w.product.inventory?.quantity ?? 0) <= 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
