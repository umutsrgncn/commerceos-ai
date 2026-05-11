import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  getFeaturedProducts,
  listShopCategories,
} from "@/lib/shop/queries";
import { ProductCard } from "./components/product-card";
import { ShopImage } from "./components/shop-image";

export const revalidate = 300;

// Kategori → vurgu rengi + bg + label
const CAT_META: Record<
  string,
  { bg: string; text: string; label: string; ring: string }
> = {
  tisort: { bg: "bg-[oklch(0.62_0.18_22)]", text: "text-[oklch(0.62_0.18_22)]", label: "Coral · Tişört", ring: "ring-[oklch(0.62_0.18_22)]/30" },
  pantolon: { bg: "bg-[oklch(0.42_0.12_265)]", text: "text-[oklch(0.42_0.12_265)]", label: "Indigo · Pantolon", ring: "ring-[oklch(0.42_0.12_265)]/30" },
  ayakkabi: { bg: "bg-[oklch(0.68_0.14_75)]", text: "text-[oklch(0.68_0.14_75)]", label: "Ochre · Ayakkabı", ring: "ring-[oklch(0.68_0.14_75)]/30" },
  canta: { bg: "bg-[oklch(0.42_0.13_340)]", text: "text-[oklch(0.42_0.13_340)]", label: "Plum · Çanta", ring: "ring-[oklch(0.42_0.13_340)]/30" },
  aksesuar: { bg: "bg-[oklch(0.65_0.15_15)]", text: "text-[oklch(0.65_0.15_15)]", label: "Rose · Aksesuar", ring: "ring-[oklch(0.65_0.15_15)]/30" },
  "ev-tekstili": { bg: "bg-[oklch(0.55_0.13_45)]", text: "text-[oklch(0.55_0.13_45)]", label: "Terracotta · Ev", ring: "ring-[oklch(0.55_0.13_45)]/30" },
  bebek: { bg: "bg-[oklch(0.65_0.12_145)]", text: "text-[oklch(0.65_0.12_145)]", label: "Sage · Bebek", ring: "ring-[oklch(0.65_0.12_145)]/30" },
  hediye: { bg: "bg-[oklch(0.58_0.14_295)]", text: "text-[oklch(0.58_0.14_295)]", label: "Lavender · Hediye", ring: "ring-[oklch(0.58_0.14_295)]/30" },
};

function catMeta(slug: string) {
  return CAT_META[slug] ?? {
    bg: "bg-[color:var(--color-accent)]",
    text: "text-[color:var(--color-accent)]",
    label: "Kategori",
    ring: "ring-[color:var(--color-accent)]/30",
  };
}

export default async function ShopHomepage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(12),
    listShopCategories(),
  ]);

  return (
    <>
      {/* ─────────── HERO — büyük tipografi + 3 gerçek ürün görseli ─────────── */}
      <section className="relative overflow-hidden">
        {/* Dekoratif renkli orbs — soft, sayfaya enerji katar */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, oklch(0.62 0.18 22 / 0.4), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 top-40 h-[28rem] w-[28rem] rounded-full blur-3xl opacity-25"
          style={{ background: "radial-gradient(circle, oklch(0.42 0.12 265 / 0.45), transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 pb-24 pt-14 sm:pt-20 lg:grid-cols-12 lg:gap-14 lg:pt-28">
          {/* Sol — metin */}
          <div className="shop-rise lg:col-span-6 xl:col-span-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)]/[0.04] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--color-accent)] animate-pulse" />
              <span>Bahar 2026 · Yayında</span>
            </div>
            <h1 className="mt-5 font-display text-[52px] italic leading-[0.9] sm:text-7xl lg:text-[88px]">
              Düşünülmüş
              <br />
              <span className="relative inline-block">
                <span className="relative z-10">kumaş,</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-2 h-3 -z-0 bg-[oklch(0.68_0.14_75)]/40"
                />
              </span>
              <br />
              sade <em className="text-[color:var(--color-accent)]">kesim.</em>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-[color:var(--color-muted)]">
              Anadolu'da dokunan, İstanbul'da kesilen pamuklu giyim. Her parça
              sınırlı sayıda, her renk dikkatle seçilmiş.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href={"/shop/c/tisort" as never}
                className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-6 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:bg-[color:var(--color-accent)] hover:gap-3"
              >
                Koleksiyona gir
                <ArrowRight className="h-4 w-4 transition-transform" />
              </Link>
              <Link
                href={"/shop/c" as never}
                className="shop-link text-sm font-medium"
              >
                Tüm kategoriler →
              </Link>
            </div>

            <dl className="mt-12 grid max-w-md grid-cols-3 gap-6 border-t border-[color:var(--color-border)] pt-6 text-xs">
              <Stat label="Üretim" value="100% pamuk" tone="emerald" />
              <Stat label="Kargo" value="2-3 iş günü" tone="coral" />
              <Stat label="İade" value="14 gün" tone="indigo" />
            </dl>
          </div>

          {/* Sağ — 3 gerçek ürün görseli (asymmetric) */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div className="grid grid-cols-12 gap-3 sm:gap-4">
              <Link
                href={"/shop/p/pamuk-basic-tisort-beyaz-105" as never}
                className="group relative col-span-7 row-span-2 aspect-[4/5] overflow-hidden rounded-2xl bg-[color:var(--color-fg)]/[0.04]"
              >
                <ShopImage
                  src="/products/pamuk-basic-tisort-beyaz-105.jpg"
                  alt="Pamuk Basic Tişört"
                  priority
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                <div className="absolute inset-x-4 bottom-4">
                  <span className="rounded-full bg-[color:var(--color-bg)]/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
                    Pamuk Basic Tişört
                  </span>
                </div>
              </Link>

              <Link
                href={"/shop/p/bot-kahverengi-825" as never}
                className="group relative col-span-5 aspect-square overflow-hidden rounded-2xl bg-[color:var(--color-fg)]/[0.04]"
              >
                <ShopImage
                  src="/products/bot-kahverengi-825.jpg"
                  alt="Bot Kahverengi"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-x-3 bottom-3">
                  <span className="rounded-full bg-[oklch(0.68_0.14_75)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Chelsea Bot
                  </span>
                </div>
              </Link>

              <Link
                href={"/shop/p/omuz-cantasi-bordo-241" as never}
                className="group relative col-span-5 aspect-square overflow-hidden rounded-2xl bg-[color:var(--color-fg)]/[0.04]"
              >
                <ShopImage
                  src="/products/omuz-cantasi-bordo-241.jpg"
                  alt="Omuz Çantası Bordo"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
                />
                <div className="absolute inset-x-3 bottom-3">
                  <span className="rounded-full bg-[oklch(0.42_0.13_340)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                    Bordo Çanta
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Marquee şerit — daha enerjik */}
        <div className="relative overflow-hidden border-y border-[color:var(--color-border)] bg-[color:var(--color-fg)] py-5 text-[color:var(--color-bg)]">
          <div className="flex animate-[scroll_40s_linear_infinite] items-center gap-12 whitespace-nowrap text-sm">
            {[...Array(6)].map((_, i) => (
              <span key={i} className="flex items-center gap-10 font-display italic text-2xl">
                <span>Pamuk Tekstil</span>
                <span className="text-[oklch(0.68_0.14_75)]">★</span>
                <span>Bahar 2026</span>
                <span className="text-[oklch(0.62_0.18_22)]">★</span>
                <span>İstanbul</span>
                <span className="text-[oklch(0.65_0.15_15)]">★</span>
                <span>El emeği</span>
                <span className="text-[oklch(0.42_0.12_265)]">★</span>
                <span>Doğal kumaş</span>
                <span className="text-[oklch(0.65_0.12_145)]">★</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── KATEGORİLER — renk patlaması ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-accent)]">
              {categories.length} kategori
            </span>
            <h2 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
              Her renk bir
              <br />
              <em className="text-[color:var(--color-accent)]">hikâye.</em>
            </h2>
          </div>
          <Link href={"/shop/c" as never} className="shop-link text-sm font-medium">
            Tümünü gör →
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {categories.slice(0, 8).map((c, i) => {
            const meta = catMeta(c.slug);
            return (
              <Link
                key={c.id}
                href={`/shop/c/${c.slug}` as never}
                className={`group relative aspect-[3/4] overflow-hidden rounded-2xl ${meta.bg} text-white shop-rise transition-transform hover:-translate-y-1`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="absolute inset-0 grain-bg opacity-30" />
                <div className="relative flex h-full flex-col justify-between p-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">
                    {c.productCount} ürün
                  </span>
                  <div>
                    <h3 className="font-display text-3xl italic leading-tight sm:text-4xl">
                      {c.name}
                    </h3>
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium opacity-90 group-hover:gap-3 transition-all">
                      Keşfet
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─────────── ÖNE ÇIKAN — magazin layoutu ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.62_0.18_22)]">
              Yeni gelenler
            </p>
            <h2 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
              Bu hafta <em className="text-[color:var(--color-accent)]">seçildi.</em>
            </h2>
          </div>
          <Link href={"/shop/c" as never} className="shop-link text-sm font-medium">
            Tüm ürünler →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
          {featured.slice(0, 8).map((p) => (
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
      </section>

      {/* ─────────── MARKA STATEMENT — bold ─────────── */}
      <section className="relative overflow-hidden bg-[color:var(--color-fg)] text-[color:var(--color-bg)]">
        {/* dekoratif renkli circle */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.65 0.15 15 / 0.5), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -bottom-20 h-96 w-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, oklch(0.42 0.12 265 / 0.5), transparent 70%)" }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.68_0.14_75)]">
              Marka hikâyesi
            </p>
            <p className="mt-6 font-display text-4xl italic leading-tight sm:text-6xl">
              "Hızlı moda bizi
              <br />
              hiç ilgilendirmedi.
              <br />
              Bir tişört bir mevsimden
              <br />
              <em className="text-[oklch(0.68_0.14_75)]">fazla yaşamalı.</em>"
            </p>
            <div className="mt-10 flex items-center gap-3 text-xs opacity-80">
              <span className="h-px w-10 bg-current opacity-50" />
              <span>Defne A. · Kurucu, 2018</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:col-span-5">
            <Pill text="100% organik pamuk" tone="emerald" />
            <Pill text="OEKO-TEX sertifikalı" tone="indigo" />
            <Pill text="6 ay garanti" tone="ochre" />
            <Pill text="Yerel üretim" tone="rose" />
          </div>
        </div>
      </section>

      {/* ─────────── İKİNCİ ÜRÜN HATTI — 4'lü editorial grid ─────────── */}
      {featured.length > 8 && (
        <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[oklch(0.42_0.13_340)]">
              Dahası
            </p>
            <h2 className="mt-3 font-display text-5xl italic leading-[0.95] sm:text-6xl">
              Koleksiyondan
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 lg:grid-cols-4 lg:gap-x-6">
            {featured.slice(8, 12).map((p) => (
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
        </section>
      )}
    </>
  );
}

const STAT_TONES = {
  emerald: "before:bg-[color:var(--color-accent)]",
  coral: "before:bg-[oklch(0.62_0.18_22)]",
  indigo: "before:bg-[oklch(0.42_0.12_265)]",
} as const;

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: keyof typeof STAT_TONES;
}) {
  return (
    <div
      className={`relative pl-3 before:absolute before:left-0 before:top-1 before:h-3 before:w-1 before:rounded-full ${STAT_TONES[tone]}`}
    >
      <dt className="text-[10px] uppercase tracking-wider text-[color:var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}

const PILL_TONES = {
  emerald: "bg-[color:var(--color-accent)]/15 text-[oklch(0.65_0.12_145)] ring-[color:var(--color-accent)]/30",
  indigo: "bg-[oklch(0.42_0.12_265)]/15 text-[oklch(0.65_0.15_265)] ring-[oklch(0.42_0.12_265)]/30",
  ochre: "bg-[oklch(0.68_0.14_75)]/15 text-[oklch(0.78_0.14_75)] ring-[oklch(0.68_0.14_75)]/30",
  rose: "bg-[oklch(0.65_0.15_15)]/15 text-[oklch(0.75_0.15_15)] ring-[oklch(0.65_0.15_15)]/30",
} as const;

function Pill({ text, tone }: { text: string; tone: keyof typeof PILL_TONES }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl px-4 py-6 text-center text-sm font-medium ring-1 ring-inset ${PILL_TONES[tone]}`}
    >
      {text}
    </div>
  );
}
