import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingBag } from "lucide-react";

import { readCart } from "@/lib/shop/cart";
import { CartPageClient } from "./components/cart-page-client";

export const metadata = { title: "Sepetim · Pamuk" };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await readCart();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] text-[color:var(--color-muted)]">
        <Link href={"/shop" as never} className="hover:text-[color:var(--color-fg)]">
          <ArrowLeft className="inline h-3 w-3" /> Alışverişe dön
        </Link>
      </nav>

      <header className="mb-10">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
          {cart.itemCount} ürün
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
          Sepetim
        </h1>
      </header>

      {cart.items.length === 0 ? (
        <EmptyCart />
      ) : (
        <CartPageClient initial={cart} />
      )}
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[color:var(--color-border)] py-24 text-center">
      <div>
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <p className="mt-5 font-display text-3xl italic">Sepetin henüz boş</p>
        <p className="mt-2 max-w-sm text-sm text-[color:var(--color-muted)]">
          Yeni gelenleri keşfetmek için aşağı bak. Beğendiğin parçayı sepete
          ekleyince burada listelenir.
        </p>
        <Link
          href={"/shop" as never}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium text-[color:var(--color-bg)] hover:bg-[color:var(--color-accent)]"
        >
          Alışverişe başla
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
