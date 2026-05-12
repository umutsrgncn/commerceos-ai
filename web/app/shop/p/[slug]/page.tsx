import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Package,
  RefreshCcw,
  Star,
  Truck,
} from "lucide-react";

import {
  getShopProductBySlug,
  listRelatedProducts,
} from "@/lib/shop/queries";
import { isInWishlist } from "@/lib/shop/wishlist";
import { BuyActions } from "../../components/buy-actions";
import { Price } from "../../components/price";
import { ProductCard } from "../../components/product-card";
import { ProductGallery } from "./components/product-gallery";
import { cn } from "@/lib/cn";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getShopProductBySlug(slug);
  if (!p) return { title: "Ürün bulunamadı · Pamuk" };
  return {
    title: `${p.name} · Pamuk`,
    description: p.description?.slice(0, 200) ?? undefined,
    openGraph: {
      title: p.name,
      description: p.description?.slice(0, 200) ?? undefined,
      images: p.images.length > 0 ? [p.images[0]] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getShopProductBySlug(slug);
  if (!p) notFound();

  const related = await listRelatedProducts(p.id, p.category?.id ?? null, 4);
  const wished = await isInWishlist(p.id);

  const stockText =
    p.stockQuantity === 0
      ? "Tükendi"
      : p.stockQuantity <= 3
        ? `Son ${p.stockQuantity} adet`
        : "Stokta";
  const stockTone =
    p.stockQuantity === 0
      ? "text-red-500"
      : p.stockQuantity <= 3
        ? "text-[color:var(--color-warn)]"
        : "text-[color:var(--color-accent)]";

  return (
    <div className="mx-auto max-w-7xl px-6 py-8 lg:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-[11px] text-[color:var(--color-muted)]">
        <Link href={"/shop" as never} className="hover:text-[color:var(--color-fg)]">
          Ana sayfa
        </Link>
        <span>/</span>
        {p.category && (
          <>
            <Link
              href={`/shop/c/${p.category.slug}` as never}
              className="hover:text-[color:var(--color-fg)]"
            >
              {p.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="truncate text-[color:var(--color-fg)]">{p.name}</span>
      </nav>

      {/* Ana grid */}
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Sol — galeri */}
        <div className="lg:col-span-7">
          <ProductGallery images={p.images} alt={p.name} />
        </div>

        {/* Sağ — info */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            {/* Kategori chip */}
            {p.category && (
              <Link
                href={`/shop/c/${p.category.slug}` as never}
                className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)] hover:underline"
              >
                {p.category.name}
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}

            <h1 className="mt-3 font-display text-4xl italic leading-[1.05] sm:text-5xl">
              {p.name}
            </h1>

            {/* Rating */}
            {p.rating.count > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--color-muted)]">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3.5 w-3.5",
                        s <= Math.round(p.rating.average ?? 0)
                          ? "fill-[color:var(--color-accent)] text-[color:var(--color-accent)]"
                          : "text-[color:var(--color-border)]",
                      )}
                    />
                  ))}
                </div>
                <span>
                  {p.rating.average?.toFixed(1)} · {p.rating.count} değerlendirme
                </span>
              </div>
            )}

            {/* Fiyat */}
            <div className="mt-6">
              <Price amount={p.price} size="xl" currency={p.currency} />
              <p className="mt-1 text-[11px] text-[color:var(--color-muted)]">
                KDV dahil · 750 ₺ üzeri kargo ücretsiz
              </p>
            </div>

            {/* Stok durumu */}
            <div className={cn("mt-5 flex items-center gap-2 text-xs font-medium", stockTone)}>
              <span className="relative inline-flex h-2 w-2 items-center justify-center">
                <span
                  className={cn(
                    "absolute inset-0 rounded-full",
                    p.stockQuantity > 0 ? "bg-current" : "bg-current/50",
                  )}
                />
                {p.stockQuantity > 0 && (
                  <span className="absolute inset-0 rounded-full bg-current animate-ping opacity-40" />
                )}
              </span>
              {stockText}
            </div>

            {/* CTA'lar */}
            <BuyActions
              productId={p.id}
              outOfStock={p.stockQuantity === 0}
              initialWishlisted={wished}
            />

            {/* Açıklama */}
            {p.description && (
              <div className="mt-10 border-t border-[color:var(--color-border)] pt-8">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Ürün hakkında
                </h2>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[color:var(--color-fg)]/85">
                  {p.description}
                </p>
              </div>
            )}

            {/* Garantiler */}
            <ul className="mt-8 grid grid-cols-1 gap-2 border-t border-[color:var(--color-border)] pt-6 sm:grid-cols-2">
              <Guarantee
                icon={<Truck className="h-3.5 w-3.5" />}
                title="Hızlı kargo"
                detail="2-3 iş günü"
              />
              <Guarantee
                icon={<RefreshCcw className="h-3.5 w-3.5" />}
                title="14 gün iade"
                detail="Soru sorulmaz"
              />
              <Guarantee
                icon={<Package className="h-3.5 w-3.5" />}
                title="Özenli paket"
                detail="Geri dönüştürülebilir"
              />
              <Guarantee
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                title="Doğal kumaş"
                detail="OEKO-TEX sertifikalı"
              />
            </ul>

            <p className="mt-6 text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
              SKU: <span className="font-mono">{p.sku}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Reviews preview */}
      {p.reviews.length > 0 && (
        <section className="mt-24 border-t border-[color:var(--color-border)] pt-16">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
                Müşteri yorumları
              </p>
              <h2 className="mt-2 font-display text-3xl italic">
                Ne diyor müşterilerimiz?
              </h2>
            </div>
            <span className="text-xs text-[color:var(--color-muted)]">
              {p.rating.count} değerlendirme
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.reviews.slice(0, 6).map((r) => (
              <article
                key={r.id}
                className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5"
              >
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "h-3 w-3",
                        s <= r.rating
                          ? "fill-[color:var(--color-accent)] text-[color:var(--color-accent)]"
                          : "text-[color:var(--color-border)]",
                      )}
                    />
                  ))}
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--color-fg)]/85">
                  {r.body}
                </p>
                <div className="mt-4 flex items-center justify-between text-[10px] text-[color:var(--color-muted)]">
                  <span>{r.authorName}</span>
                  <time>
                    {new Date(r.createdAt).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </time>
                </div>
                {r.reply && (
                  <div className="mt-3 rounded-md border-l-2 border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/[0.04] p-3 text-xs">
                    <span className="font-semibold text-[color:var(--color-accent)]">
                      Pamuk
                    </span>
                    <p className="mt-1 text-[color:var(--color-fg)]/80">
                      {r.reply}
                    </p>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-24 border-t border-[color:var(--color-border)] pt-16">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              Sana da yakışır
            </p>
            <h2 className="mt-2 font-display text-3xl italic">
              Birlikte iyi gider
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {related.map((r) => (
              <ProductCard
                key={r.id}
                product={{
                  id: r.id,
                  slug: r.slug,
                  name: r.name,
                  price: r.price,
                  compareAt: r.compareAt,
                  imageUrl: r.imageUrl,
                  outOfStock: !r.inStock,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Guarantee({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-md bg-[color:var(--color-surface)] px-3 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[color:var(--color-accent)]/10 text-[color:var(--color-accent)]">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium leading-tight">{title}</p>
        <p className="text-[10px] text-[color:var(--color-muted)]">{detail}</p>
      </div>
    </li>
  );
}
