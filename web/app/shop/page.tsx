import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  getFeaturedProducts,
  listShopCategories,
} from "@/lib/shop/queries";
import { ProductCard } from "./components/product-card";

export const revalidate = 300; // 5 dakika ISR

export default async function ShopHomepage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    listShopCategories(),
  ]);

  return (
    <>
      {/* ─────────── HERO ─────────── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 pb-20 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-12 lg:pt-24">
          {/* Sol — metin */}
          <div className="shop-rise lg:col-span-6 xl:col-span-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              Bahar 2026
            </p>
            <h1 className="mt-4 font-display text-[44px] italic leading-[0.95] sm:text-6xl lg:text-7xl">
              Düşünülmüş
              <br />
              kumaş, sade
              <br />
              <span className="text-[color:var(--color-accent)]">kesim.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-[color:var(--color-muted)]">
              Anadolu'da dokunan, İstanbul'da kesilen pamuklu giyim. Her parça
              sınırlı sayıda, her renk dikkatle seçilmiş.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={"/shop/c/tisort" as never}
                className="inline-flex items-center gap-2 rounded-md bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)]"
              >
                Koleksiyona gir
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={"/shop/c" as never}
                className="shop-link text-sm font-medium"
              >
                Tüm kategoriler
              </Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-[color:var(--color-border)] pt-6 text-xs">
              <Stat label="Üretim" value="100% pamuk" />
              <Stat label="Kargo" value="2-3 iş günü" />
              <Stat label="İade" value="14 gün" />
            </dl>
          </div>

          {/* Sağ — büyük görsel + magazine layout */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <Link
                href={"/shop/c/tisort" as never}
                className="group relative col-span-7 row-span-2 aspect-[4/5] overflow-hidden rounded-lg bg-[color:var(--color-fg)]/[0.04]"
              >
                <HeroImage
                  src="/ai-tools/tshirts.jpg"
                  alt="Pamuklu tişört koleksiyonu"
                />
                <HeroLabel name="Tişört" tone="dark" />
              </Link>
              <div className="group relative col-span-5 aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-[color:var(--color-accent)] via-[color:var(--color-accent)]/80 to-[color:var(--color-accent)]/60 text-[color:var(--color-accent-fg)]">
                <div className="absolute inset-0 grain-bg opacity-40" />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">
                    Atölye
                  </span>
                  <div>
                    <p className="font-display text-2xl italic leading-tight sm:text-3xl">
                      El dikişi
                      <br />
                      kapsül koleksiyon
                    </p>
                    <span className="mt-3 inline-block text-[11px] opacity-90">
                      24 parça · sınırlı sayıda
                    </span>
                  </div>
                </div>
              </div>
              <div className="group relative col-span-5 aspect-square overflow-hidden rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                <div className="absolute inset-0 grain-bg" />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                    Manifesto
                  </span>
                  <p className="font-display text-xl italic leading-snug sm:text-2xl">
                    Yavaş üretim,
                    <br />
                    dürüst fiyat,
                    <br />
                    <span className="text-[color:var(--color-accent)]">
                      uzun ömür
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dekoratif şerit */}
        <div className="relative overflow-hidden border-y border-[color:var(--color-border)] bg-[color:var(--color-surface)] py-6">
          <div className="flex items-center gap-12 whitespace-nowrap text-sm">
            {[...Array(8)].map((_, i) => (
              <span
                key={i}
                className="flex items-center gap-12 font-display text-2xl italic text-[color:var(--color-fg)]/70"
              >
                <span>Pamuk Tekstil</span>
                <span className="text-[color:var(--color-accent)]">·</span>
                <span>2026 Bahar</span>
                <span className="text-[color:var(--color-accent)]">·</span>
                <span>İstanbul</span>
                <span className="text-[color:var(--color-accent)]">·</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── KATEGORİ TILES ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-4xl italic leading-tight sm:text-5xl">
              Kategoriye göre gez
            </h2>
            <p className="mt-2 text-sm text-[color:var(--color-muted)]">
              {categories.length} kategori — toplam{" "}
              {categories.reduce((s, c) => s + c.productCount, 0)} ürün
            </p>
          </div>
          <Link
            href={"/shop/c" as never}
            className="shop-link text-sm font-medium"
          >
            Tümünü gör →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {categories.slice(0, 8).map((c, i) => (
            <CategoryTile key={c.id} category={c} delay={i * 50} />
          ))}
        </div>
      </section>

      {/* ─────────── ÖNE ÇIKAN ÜRÜNLER ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              Yeni gelenler
            </p>
            <h2 className="mt-2 font-display text-4xl italic leading-tight sm:text-5xl">
              Bu hafta seçildi
            </h2>
          </div>
          <Link
            href={"/shop/c" as never}
            className="shop-link text-sm font-medium"
          >
            Tüm ürünler →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12">
          {featured.map((p) => (
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
                badges: p.compareAt ? [{ label: "İndirim", tone: "accent" }] : [],
              }}
            />
          ))}
        </div>
      </section>

      {/* ─────────── BÜYÜK MARKA STATEMENT ─────────── */}
      <section className="border-y border-[color:var(--color-border)] bg-[color:var(--color-accent)]/[0.05]">
        <div className="mx-auto max-w-5xl px-6 py-24 text-center lg:py-32">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
            Marka hikâyesi
          </p>
          <p className="mx-auto mt-6 max-w-3xl font-display text-3xl italic leading-tight sm:text-5xl">
            "Hızlı moda hiç ilgimizi çekmedi.
            <br />
            Bir tişört bir mevsimden fazla yaşamalı."
          </p>
          <div className="mt-8 inline-flex items-center gap-3 text-xs text-[color:var(--color-muted)]">
            <span className="h-px w-8 bg-[color:var(--color-border)]" />
            <span>Defne A. · Kurucu</span>
            <span className="h-px w-8 bg-[color:var(--color-border)]" />
          </div>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

function HeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
    />
  );
}

function HeroLabel({ name, tone }: { name: string; tone: "dark" | "light" }) {
  return (
    <span
      className={
        tone === "dark"
          ? "absolute bottom-4 left-4 rounded-full bg-[color:var(--color-fg)]/85 px-3 py-1 text-[11px] font-medium text-[color:var(--color-bg)] backdrop-blur"
          : "absolute bottom-4 left-4 rounded-full bg-[color:var(--color-surface)]/90 px-3 py-1 text-[11px] font-medium text-[color:var(--color-fg)] backdrop-blur"
      }
    >
      {name}
    </span>
  );
}

function CategoryTile({
  category,
  delay,
}: {
  category: { slug: string; name: string; productCount: number };
  delay: number;
}) {
  return (
    <Link
      href={`/shop/c/${category.slug}` as never}
      className="group relative aspect-square overflow-hidden rounded-md bg-gradient-to-br from-[color:var(--color-accent)]/10 via-[color:var(--color-fg)]/[0.03] to-[color:var(--color-fg)]/[0.06] shop-rise"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 grain-bg" />
      <div className="relative flex h-full flex-col justify-between p-4 sm:p-5">
        <span className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
          {category.productCount} ürün
        </span>
        <div className="flex items-end justify-between gap-2">
          <span className="font-display text-2xl italic leading-tight sm:text-3xl">
            {category.name}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-1 group-hover:text-[color:var(--color-accent)]" />
        </div>
      </div>
    </Link>
  );
}
