import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listShopCategories } from "@/lib/shop/queries";

export const revalidate = 600;

export const metadata = { title: "Kategoriler · Pamuk" };

export default async function CategoriesIndexPage() {
  const categories = await listShopCategories();

  return (
    <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
      <div className="mb-14 max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
          Tüm koleksiyon
        </p>
        <h1 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
          Kategoriler
        </h1>
        <p className="mt-4 text-base text-[color:var(--color-muted)]">
          {categories.length} kategori — toplam{" "}
          {categories.reduce((s, c) => s + c.productCount, 0)} ürün.
        </p>
      </div>

      <ul className="divide-y divide-[color:var(--color-border)]">
        {categories.map((c) => (
          <li key={c.id}>
            <Link
              href={`/shop/c/${c.slug}` as never}
              className="group flex items-center justify-between gap-4 py-6 transition-colors hover:bg-[color:var(--color-fg)]/[0.015] sm:py-8"
            >
              <div>
                <span className="font-display text-3xl italic leading-none sm:text-5xl">
                  {c.name}
                </span>
                <span className="mt-2 block text-xs text-[color:var(--color-muted)]">
                  {c.productCount} ürün
                </span>
              </div>
              <ArrowRight className="h-5 w-5 shrink-0 text-[color:var(--color-muted)] transition-transform group-hover:translate-x-2 group-hover:text-[color:var(--color-accent)]" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
