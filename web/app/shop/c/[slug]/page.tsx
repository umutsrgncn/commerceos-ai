import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import {
  getShopCategoryBySlug,
  listShopCategories,
  listShopProducts,
} from "@/lib/shop/queries";
import { ProductCard } from "../../components/product-card";
import { SortSelect } from "../../components/sort-select";
import { cn } from "@/lib/cn";

export const revalidate = 300;

const SORT_OPTIONS = [
  { value: "new", label: "Yeniler önce" },
  { value: "price-asc", label: "Fiyat: artan" },
  { value: "price-desc", label: "Fiyat: azalan" },
  { value: "popular", label: "En çok satanlar" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// Kategori bazlı renk paleti — header'da accent vurgusu
const CAT_ACCENT: Record<string, { bg: string; text: string; ring: string }> = {
  tisort: { bg: "bg-[oklch(0.62_0.18_22)]/10", text: "text-[oklch(0.62_0.18_22)]", ring: "ring-[oklch(0.62_0.18_22)]/30" },
  pantolon: { bg: "bg-[oklch(0.42_0.12_265)]/10", text: "text-[oklch(0.42_0.12_265)]", ring: "ring-[oklch(0.42_0.12_265)]/30" },
  ayakkabi: { bg: "bg-[oklch(0.68_0.14_75)]/10", text: "text-[oklch(0.68_0.14_75)]", ring: "ring-[oklch(0.68_0.14_75)]/30" },
  canta: { bg: "bg-[oklch(0.42_0.13_340)]/10", text: "text-[oklch(0.42_0.13_340)]", ring: "ring-[oklch(0.42_0.13_340)]/30" },
  aksesuar: { bg: "bg-[oklch(0.65_0.15_15)]/10", text: "text-[oklch(0.65_0.15_15)]", ring: "ring-[oklch(0.65_0.15_15)]/30" },
  "ev-tekstili": { bg: "bg-[oklch(0.55_0.13_45)]/10", text: "text-[oklch(0.55_0.13_45)]", ring: "ring-[oklch(0.55_0.13_45)]/30" },
  bebek: { bg: "bg-[oklch(0.65_0.12_145)]/10", text: "text-[oklch(0.65_0.12_145)]", ring: "ring-[oklch(0.65_0.12_145)]/30" },
  hediye: { bg: "bg-[oklch(0.58_0.14_295)]/10", text: "text-[oklch(0.58_0.14_295)]", ring: "ring-[oklch(0.58_0.14_295)]/30" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = await getShopCategoryBySlug(slug);
  return {
    title: cat ? `${cat.name} · Pamuk` : "Kategori bulunamadı · Pamuk",
    description: cat?.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const sort = (
    SORT_OPTIONS.find((o) => o.value === sp.sort)?.value ?? "new"
  ) as SortValue;
  const page = Math.max(1, Number(sp.page) || 1);

  const cat = await getShopCategoryBySlug(slug);
  if (!cat) notFound();

  const [{ items, total, pageSize }, allCats] = await Promise.all([
    listShopProducts({ categorySlug: slug, sort, page, pageSize: 24 }),
    listShopCategories(),
  ]);

  const totalPages = Math.ceil(total / pageSize);
  const otherCats = allCats.filter((c) => c.slug !== slug).slice(0, 8);
  const accent = CAT_ACCENT[slug] ?? {
    bg: "bg-[color:var(--color-accent)]/10",
    text: "text-[color:var(--color-accent)]",
    ring: "ring-[color:var(--color-accent)]/30",
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-[11px] text-[color:var(--color-muted)]">
        <Link href={"/shop" as never} className="hover:text-[color:var(--color-fg)]">
          Ana sayfa
        </Link>
        <span>/</span>
        <Link href={"/shop/c" as never} className="hover:text-[color:var(--color-fg)]">
          Kategoriler
        </Link>
        <span>/</span>
        <span className="text-[color:var(--color-fg)]">{cat.name}</span>
      </nav>

      {/* Header — kategori bazlı renkli banner */}
      <header
        className={`relative mb-12 overflow-hidden rounded-3xl ${accent.bg} ring-1 ring-inset ${accent.ring} p-8 sm:p-12`}
      >
        <div className="absolute inset-0 grain-bg opacity-30" />
        <div className="relative grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span
              className={`inline-flex items-center gap-2 rounded-full bg-[color:var(--color-surface)]/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${accent.text}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${accent.text.replace("text-", "bg-")}`} />
              Koleksiyon · {total} ürün
            </span>
            <h1 className="mt-5 font-display text-5xl italic leading-[0.95] sm:text-7xl lg:text-[88px]">
              {cat.name}
            </h1>
            {cat.description && (
              <p className="mt-6 max-w-xl text-base leading-relaxed text-[color:var(--color-muted)]">
                {cat.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:col-span-4 lg:justify-end">
            <SortSelect initial={sort} />
          </div>
        </div>
      </header>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="grid place-items-center rounded-md border border-dashed border-[color:var(--color-border)] py-24 text-center">
          <div>
            <p className="font-display text-3xl italic">
              Bu kategoride henüz ürün yok.
            </p>
            <Link
              href={"/shop/c" as never}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Diğer kategorileri gör
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {items.map((p) => (
            <ProductCard
              key={p.id}
              product={{
                id: p.id,
                slug: p.slug,
                name: p.name,
                price: p.price,
                compareAt: p.compareAt,
                imageUrl: p.imageUrl,
                outOfStock: !p.inStock,
              }}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="mt-14 flex items-center justify-center gap-1"
          aria-label="Sayfalama"
        >
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const isCurrent = p === page;
            return (
              <Link
                key={p}
                href={`/shop/c/${slug}?sort=${sort}&page=${p}` as never}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-md text-xs font-medium",
                  isCurrent
                    ? "bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
                    : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.05] hover:text-[color:var(--color-fg)]",
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}

      {/* Diğer kategoriler */}
      {otherCats.length > 0 && (
        <section className="mt-24 border-t border-[color:var(--color-border)] pt-12">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
            Diğer kategoriler
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {otherCats.map((c) => (
              <Link
                key={c.id}
                href={`/shop/c/${c.slug}` as never}
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium text-[color:var(--color-fg)]/85 transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
              >
                {c.name}
                <span className="ml-2 text-[10px] text-[color:var(--color-muted)]">
                  {c.productCount}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
