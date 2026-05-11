import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  getFeaturedProducts,
  listShopCategories,
} from "@/lib/shop/queries";
import { ProductCard } from "./components/product-card";
import { ShopImage } from "./components/shop-image";

export const revalidate = 300;

export default async function ShopHomepage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(12),
    listShopCategories(),
  ]);

  // En çok ürünü olan kategoriyi hero için seç
  const heroCategory = [...categories].sort((a, b) => b.productCount - a.productCount)[0];
  // Grid: hero hariç tüm kategoriler (Çanta gibi locale-sıralama dışında kalanları da kapsa)
  const gridCategories = categories.filter((c) => c.id !== heroCategory?.id);

  return (
    <>
      {/* ─────────── HERO — minimal, editoryal, tek aksan ─────────── */}
      <section className="relative overflow-hidden border-b border-[color:var(--color-border)]">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-16 sm:pt-24 lg:grid-cols-12 lg:gap-16 lg:pt-32">
          {/* Sol — metin */}
          <div className="shop-rise lg:col-span-5">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              <span className="h-px w-8 bg-[color:var(--color-accent)]" />
              <span>Bahar 2026 · Koleksiyon</span>
            </div>
            <h1 className="mt-8 font-display text-[56px] italic leading-[0.95] sm:text-7xl lg:text-[88px]">
              Sade
              <br />
              <em className="text-[color:var(--color-accent)]">üstün</em>
              <br />
              kalan
              <br />
              giyim.
            </h1>
            <p className="mt-8 max-w-md text-[15px] leading-relaxed text-[color:var(--color-muted)]">
              Anadolu'da dokunan pamuk, İstanbul'da kesilen sade kalıp. Sınırlı
              sayıda üretilen, mevsimden mevsime geçmeyen koleksiyon.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Link
                href={"/shop/c" as never}
                className="group inline-flex items-center gap-2 rounded-full bg-[color:var(--color-fg)] px-7 py-3.5 text-sm font-medium text-[color:var(--color-bg)] transition hover:gap-3 hover:bg-[color:var(--color-accent)]"
              >
                Koleksiyonu gez
                <ArrowRight className="h-4 w-4 transition-transform" />
              </Link>
              <Link
                href={"/shop/c/tisort" as never}
                className="shop-link text-sm font-medium"
              >
                Yeni gelenler →
              </Link>
            </div>

            <dl className="mt-16 grid max-w-md grid-cols-3 gap-8 border-t border-[color:var(--color-border)] pt-8 text-xs">
              <Stat label="Üretim" value="100% pamuk" />
              <Stat label="Kargo" value="2-3 iş günü" />
              <Stat label="İade" value="14 gün" />
            </dl>
          </div>

          {/* Sağ — tek büyük, sakin hero görsel */}
          <div className="relative lg:col-span-7">
            {heroCategory?.imageUrl && (
              <Link
                href={`/shop/c/${heroCategory.slug}` as never}
                className="group relative block aspect-[4/5] overflow-hidden rounded-sm bg-[color:var(--color-fg)]/[0.04]"
              >
                <ShopImage
                  src={heroCategory.imageUrl}
                  alt={heroCategory.name}
                  priority
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                />
                {/* Sağ alt etiket — sofistike */}
                <div className="absolute bottom-6 right-6 left-6 flex items-end justify-between gap-4">
                  <div className="text-[color:var(--color-bg)] mix-blend-difference">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-90">
                      Bu koleksiyon
                    </p>
                    <p className="mt-1 font-display text-3xl italic">
                      {heroCategory.name}
                    </p>
                  </div>
                  <span className="rounded-full bg-[color:var(--color-bg)]/95 px-4 py-2 text-[11px] font-medium tracking-wide backdrop-blur">
                    {heroCategory.productCount} ürün →
                  </span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ─────────── KATEGORİLER — gerçek görsellerle editoryal grid ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-14 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
            <span className="h-px w-8 bg-[color:var(--color-accent)]" />
            <span>{categories.length} koleksiyon</span>
          </div>
          <h2 className="mt-6 font-display text-5xl italic leading-[0.95] sm:text-6xl">
            Her parça,
            <br />
            kendi <em className="text-[color:var(--color-accent)]">hikâyesi</em> ile.
          </h2>
        </div>

        {/* 4-2-2 asimetrik grid — büyük tile + küçükler */}
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-4 lg:grid-rows-2">
          {gridCategories.slice(0, 6).map((c, i) => {
            // İlk iki kategori büyük (2x2 ve 2x1), kalanlar 1x1
            const span =
              i === 0
                ? "lg:col-span-2 lg:row-span-2 aspect-[4/5]"
                : i === 1
                  ? "lg:col-span-2 aspect-[16/9]"
                  : "lg:col-span-1 aspect-[4/5]";
            return (
              <Link
                key={c.id}
                href={`/shop/c/${c.slug}` as never}
                className={`group relative overflow-hidden rounded-sm bg-[color:var(--color-fg)]/[0.04] shop-rise ${span}`}
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {c.imageUrl ? (
                  <ShopImage
                    src={c.imageUrl}
                    alt={c.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="absolute inset-0 grain-bg bg-[color:var(--color-accent)]/10" />
                )}

                {/* Gradient overlay — alt karartma */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />

                {/* Label */}
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3 text-white">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] opacity-80">
                      {c.productCount} ürün
                    </p>
                    <h3 className={`mt-1 font-display italic leading-tight ${i === 0 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl"}`}>
                      {c.name}
                    </h3>
                  </div>
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/95 text-[color:var(--color-fg)] transition-transform group-hover:scale-110">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Kalan kategoriler — basit chip listesi */}
        {gridCategories.length > 6 && (
          <div className="mt-10 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)] mr-2">
              Ayrıca
            </span>
            {gridCategories.slice(6).map((c) => (
              <Link
                key={c.id}
                href={`/shop/c/${c.slug}` as never}
                className="group inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-medium transition hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
              >
                {c.name}
                <span className="text-[10px] text-[color:var(--color-muted)] group-hover:text-[color:var(--color-accent)]">
                  {c.productCount}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ─────────── ŞERİT — minimal monokrom marquee ─────────── */}
      <section className="relative overflow-hidden border-y border-[color:var(--color-border)] bg-[color:var(--color-fg)] py-6 text-[color:var(--color-bg)]">
        <div className="flex animate-[scroll_45s_linear_infinite] items-center gap-16 whitespace-nowrap font-display text-2xl italic">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="flex items-center gap-16">
              <span>Pamuk Tekstil</span>
              <span className="opacity-50">/</span>
              <span>Bahar 2026</span>
              <span className="opacity-50">/</span>
              <span>İstanbul</span>
              <span className="opacity-50">/</span>
              <span>El emeği</span>
              <span className="opacity-50">/</span>
              <span>Doğal kumaş</span>
              <span className="opacity-50">/</span>
            </span>
          ))}
        </div>
      </section>

      {/* ─────────── ÖNE ÇIKAN ÜRÜNLER ─────────── */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="mb-14 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              <span className="h-px w-8 bg-[color:var(--color-accent)]" />
              <span>Yeni gelenler</span>
            </div>
            <h2 className="mt-5 font-display text-5xl italic leading-[0.95] sm:text-6xl">
              Bu hafta <em className="text-[color:var(--color-accent)]">seçildi</em>.
            </h2>
          </div>
          <Link href={"/shop/c" as never} className="shop-link text-sm font-medium">
            Tüm ürünler →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-14">
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

      {/* ─────────── MARKA STATEMENT — sofistike, sade ─────────── */}
      <section className="border-y border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-12 lg:py-32">
          <div className="lg:col-span-7">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-cognac)]">
              Marka hikâyesi
            </p>
            <p className="mt-8 font-display text-3xl italic leading-tight sm:text-5xl">
              "Hızlı moda bizi
              <br />
              hiç ilgilendirmedi.
              <br />
              Bir tişört{" "}
              <em className="text-[color:var(--color-accent)]">
                bir mevsimden fazla
              </em>
              <br />
              yaşamalı."
            </p>
            <div className="mt-10 flex items-center gap-3 text-xs text-[color:var(--color-muted)]">
              <span className="h-px w-10 bg-[color:var(--color-border)]" />
              <span>Defne A. · Kurucu, 2018</span>
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-3 lg:col-span-5 lg:self-end">
            <CredCard title="100% organik pamuk" detail="OEKO-TEX sertifikalı" />
            <CredCard title="Yerel üretim" detail="Bursa & İstanbul atölyeleri" />
            <CredCard title="14 gün iade" detail="Soru sorulmadan" />
            <CredCard title="2 yıl garanti" detail="Üretim hatalarına" />
          </ul>
        </div>
      </section>

      {/* ─────────── İKİNCİ ÜRÜN HATTI ─────────── */}
      {featured.length > 8 && (
        <section className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="mb-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[color:var(--color-muted)]">
              <span className="h-px w-8 bg-[color:var(--color-cognac)]" />
              <span>Dahası</span>
            </div>
            <h2 className="mt-5 font-display text-5xl italic leading-[0.95] sm:text-6xl">
              Koleksiyondan
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6">
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </dt>
      <dd className="mt-2 text-sm font-medium">{value}</dd>
    </div>
  );
}

function CredCard({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="group flex items-center justify-between gap-3 rounded-sm border-b border-[color:var(--color-border)] py-4 transition hover:border-[color:var(--color-accent)]">
      <div>
        <p className="font-display text-xl italic">{title}</p>
        <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">{detail}</p>
      </div>
      <span className="text-[color:var(--color-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[color:var(--color-accent)]">
        →
      </span>
    </li>
  );
}
