import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Package } from "lucide-react";

import {
  getShopCategoryBySlug,
  listShopCategories,
  listShopProducts,
} from "@/lib/shop/queries";
import { ProductCard } from "../../components/product-card";
import { ShopImage } from "../../components/shop-image";
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
  const otherCats = allCats.filter((c) => c.slug !== slug);
  const currentSortLabel =
    SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Yeniler";

  return (
    <>
      {/* ─── HERO BANNER — gerçek kategori görseli ─── */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-border)]">
        {cat.imageUrl && (
          <>
            <ShopImage
              src={cat.imageUrl}
              alt={cat.name}
              priority
              className="absolute inset-0 h-full w-full object-cover"
              sizes="100vw"
            />
            {/* Karartma overlay — text okunsun */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        )}
        {!cat.imageUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-accent)]/30 via-[color:var(--color-fg)]/[0.06] to-transparent" />
        )}

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-32">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-[11px] text-white/80">
            <Link
              href={"/shop" as never}
              className="hover:text-white"
            >
              Ana sayfa
            </Link>
            <ChevronRight className="h-3 w-3" />
            <Link
              href={"/shop/c" as never}
              className="hover:text-white"
            >
              Kategoriler
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-white">{cat.name}</span>
          </nav>

          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85">
            Koleksiyon · {total} ürün
          </p>
          <h1 className="mt-4 font-display text-6xl italic leading-[0.9] text-white sm:text-7xl lg:text-[112px]">
            {cat.name}
          </h1>
          {cat.description && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
              {cat.description}
            </p>
          )}
        </div>
      </section>

      {/* ─── STICKY FİLTER BAR ─── */}
      <div className="sticky top-16 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:py-4">
          <div className="flex items-center gap-2 overflow-x-auto text-xs">
            <span className="shrink-0 font-mono tabular-nums text-[color:var(--color-muted)]">
              {total} ürün
            </span>
            {total > 0 && (
              <>
                <span className="text-[color:var(--color-border)]">·</span>
                <span className="shrink-0 text-[color:var(--color-muted)]">
                  Sırala:{" "}
                  <strong className="text-[color:var(--color-fg)]">
                    {currentSortLabel}
                  </strong>
                </span>
              </>
            )}
          </div>
          <SortSelect initial={sort} />
        </div>
      </div>

      {/* ─── ANA GRID ─── */}
      <div className="mx-auto max-w-7xl px-6 py-12 lg:py-16">
        {items.length === 0 ? (
          <div className="grid place-items-center rounded-2xl border-2 border-dashed border-[color:var(--color-border)] py-24 text-center">
            <div>
              <Package className="mx-auto h-12 w-12 text-[color:var(--color-muted)]" />
              <p className="mt-4 font-display text-3xl italic">
                Bu kategoride henüz ürün yok
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                Yakında yeni parçalar eklenecek.
              </p>
              <Link
                href={"/shop/c" as never}
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-4 hover:no-underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Diğer kategorileri gör
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-5 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-16 xl:grid-cols-4">
            {items.map((p, i) => (
              <ProductCard
                key={p.id}
                priority={i < 4}
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
            className="mt-20 flex items-center justify-center gap-2"
            aria-label="Sayfalama"
          >
            {page > 1 && (
              <Link
                href={`/shop/c/${slug}?sort=${sort}&page=${page - 1}` as never}
                className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                <ArrowLeft className="h-3 w-3" />
                Önceki
              </Link>
            )}
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1;
              const isCurrent = p === page;
              return (
                <Link
                  key={p}
                  href={`/shop/c/${slug}?sort=${sort}&page=${p}` as never}
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-md text-xs font-medium tabular-nums",
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
            {page < totalPages && (
              <Link
                href={`/shop/c/${slug}?sort=${sort}&page=${page + 1}` as never}
                className="inline-flex items-center gap-1 rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs hover:bg-[color:var(--color-fg)]/[0.04]"
              >
                Sonraki
                <ArrowLeft className="h-3 w-3 rotate-180" />
              </Link>
            )}
          </nav>
        )}
      </div>

      {/* ─── DİĞER KATEGORİLER — görselli kartlar ─── */}
      {otherCats.length > 0 && (
        <section className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:py-24">
            <div className="mb-10 max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
                Diğer koleksiyonlar
              </p>
              <h2 className="mt-3 font-display text-4xl italic leading-tight sm:text-5xl">
                Devam et,{" "}
                <em className="text-[color:var(--color-accent)]">keşfet</em>.
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {otherCats.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href={`/shop/c/${c.slug}` as never}
                  className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-[color:var(--color-fg)]/[0.04]"
                >
                  {c.imageUrl && (
                    <ShopImage
                      src={c.imageUrl}
                      alt={c.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 text-white">
                    <p className="text-[10px] uppercase tracking-[0.2em] opacity-85">
                      {c.productCount} ürün
                    </p>
                    <p className="mt-1 font-display text-2xl italic">{c.name}</p>
                  </div>
                </Link>
              ))}
            </div>

            {otherCats.length > 4 && (
              <div className="mt-8 flex flex-wrap gap-2">
                {otherCats.slice(4).map((c) => (
                  <Link
                    key={c.id}
                    href={`/shop/c/${c.slug}` as never}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-2 text-xs font-medium transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
                  >
                    {c.name}
                    <span className="text-[10px] text-[color:var(--color-muted)]">
                      {c.productCount}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
