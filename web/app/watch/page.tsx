import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Github,
  Play,
  Sparkles,
} from "lucide-react";

import { HeroParallax } from "@/components/aceternity/hero-parallax";
import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import { HeroBgOrbs } from "@/components/landing/landing-effects";
import { WatchMarquees } from "@/components/landing/watch-marquees";
import { WatchPlayer } from "./components/watch-player";

export const metadata = {
  title: "CommerceOS — Tanıtım",
  description: "AI yöneticili e-ticaret panelinin kısa tanıtım videosu ve sayfa bakışı.",
};

const PARALLAX_PRODUCTS = [
  { title: "Dashboard", link: "/admin", thumbnail: "/team/shot-dashboard.jpg" },
  { title: "AI Geliştirici", link: "/admin/agent", thumbnail: "/team/shot-agent.jpg" },
  { title: "Siparişler", link: "/admin/orders", thumbnail: "/team/shot-orders.jpg" },
  { title: "Otopilot", link: "/admin/autopilot", thumbnail: "/team/shot-autopilot.jpg" },
  { title: "Finans", link: "/admin/finance", thumbnail: "/team/shot-finance.jpg" },
  { title: "Gelecek ödemeler", link: "/admin/finance/scheduled", thumbnail: "/team/shot-scheduled.jpg" },
  { title: "Banka", link: "/admin/bank", thumbnail: "/team/shot-bank.jpg" },
  { title: "Ürünler", link: "/admin/products", thumbnail: "/team/shot-products.jpg" },
  { title: "Müşteriler", link: "/admin/customers", thumbnail: "/team/shot-customers.jpg" },
  { title: "Analitik", link: "/admin/analytics", thumbnail: "/team/shot-analytics.jpg" },
  { title: "KVKK panel", link: "/admin/settings/kvkk", thumbnail: "/team/shot-kvkk.jpg" },
  { title: "KVKK talepleri", link: "/admin/data-requests", thumbnail: "/team/shot-data-requests.jpg" },
  { title: "Yorumlar", link: "/admin/reviews", thumbnail: "/team/shot-reviews.jpg" },
  { title: "Shop ana sayfa", link: "/shop", thumbnail: "/team/shot-shop-home.jpg" },
  { title: "Shop kategori", link: "/shop/c/tisort", thumbnail: "/team/shot-shop-category.jpg" },
  { title: "Shop ürün detay", link: "/shop/p/pamuklu-basic-tisort-bej", thumbnail: "/team/shot-shop-product.jpg" },
];

const PARALLAX_HEADER = (
  <div className="relative mx-auto w-full max-w-7xl px-4 pt-16 pb-8 sm:pt-20">
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
      <Sparkles className="h-3 w-3" />
      Tüm sayfalara hızlı bakış
    </span>
    <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
      Panelin{" "}
      <span className="bg-gradient-to-br from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
        her modülü
      </span>{" "}
      bir bakışta
    </h2>
    <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
      Admin paneli, AI Geliştirici, otopilot, finans, banka, KVKK, mağaza —
      hepsi production'dan canlı görüntü.
    </p>
  </div>
);

const HIGHLIGHTS = [
  { title: "AI Geliştirici", desc: "Doğal dil → kod → test → canlı. Onaylar sende." },
  { title: "Otopilot 7 görev", desc: "Yorum, e-fatura, stok, havale, fiyat, segment, anomali." },
  { title: "KVKK panel", desc: "Veri silme talepleri, çerez yönetimi, gizlilik metni AI üretimi." },
  { title: "Finans + Banka", desc: "Cash flow tahmini, havale eşleştirme, gelecek ödemeler." },
];

export default function WatchPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      <HeroBgOrbs />

      {/* Top bar */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <CommerceOSLogo size={32} />
            <span className="text-base font-semibold tracking-tight">
              CommerceOS
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] text-white/70 backdrop-blur transition hover:border-white/30 hover:text-white"
          >
            <ArrowLeft className="h-3 w-3" />
            Ana sayfaya dön
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={"https://github.com/umutsrgncn/commerceos-ai" as never}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 backdrop-blur transition hover:border-white/20 hover:text-white sm:inline-flex"
          >
            <Github className="h-3.5 w-3.5" />
            GitHub
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-white text-black hover:bg-white/90">
              Demo panele git
            </Button>
          </Link>
        </div>
      </header>

      {/* ─── Hero — video player + yandan akan marquee'ler ─── */}
      <section className="relative z-10 overflow-hidden px-6 pb-20 pt-8 sm:pt-16">
        {/* Yan akan feature şeritleri (yalnız lg+) */}
        <WatchMarquees />

        <div className="relative z-10 mx-auto max-w-5xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
              <Play className="h-3 w-3 fill-fuchsia-300" />
              Tanıtım
            </span>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              CommerceOS,{" "}
              <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                bir bakışta
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm text-white/65 sm:text-base">
              AI yöneticili e-ticaret panelinin önemli özelliklerini videoda gör,
              aşağıda her sayfanın canlı görüntüsünü gez.
            </p>
          </div>

          {/* Player */}
          <div className="relative mx-auto mt-12 max-w-4xl">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/25 to-emerald-500/20 opacity-70 blur-3xl" />
            <WatchPlayer />
          </div>

          {/* Highlight strip */}
          <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
            {HIGHLIGHTS.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                  {h.title}
                </div>
                <div className="mt-1 text-[10px] leading-snug text-white/55">
                  {h.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI Geliştirici teaser ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-12">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-fuchsia-500/10 via-indigo-500/10 to-emerald-500/5 p-6 sm:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl"
          />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fuchsia-200">
                <Bot className="h-3 w-3" />
                Flagship
              </span>
              <h2 className="mt-4 text-balance text-3xl font-semibold leading-tight sm:text-4xl">
                Sen düşün.{" "}
                <span className="bg-gradient-to-br from-fuchsia-300 to-amber-300 bg-clip-text text-transparent">
                  AI kodlasın.
                </span>
              </h2>
              <p className="mt-3 max-w-md text-sm text-white/65">
                Doğal dilde görev yaz → agent planlar, kodlar, test eder,
                önizleme açar. Sen sadece onaylarsın.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/admin/agent">
                  <Button
                    size="sm"
                    className="border-0 bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white hover:from-fuchsia-400 hover:to-indigo-400"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Canlı dene
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
                <Link
                  href={"/#ai-developer" as never}
                  className="text-xs text-white/55 hover:text-white"
                >
                  Detay →
                </Link>
              </div>
            </div>

            {/* Mini agent panel preview */}
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="h-2 w-2 rounded-full bg-red-500/70" />
                <span className="h-2 w-2 rounded-full bg-amber-500/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-500/70" />
                <span className="ml-2 font-mono text-[9px] text-white/40">
                  commerceos.cloud/admin/agent
                </span>
              </div>
              <img
                src="/team/shot-agent.jpg"
                alt="AI Geliştirici paneli"
                className="block w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Parallax galeri ─── */}
      <section className="relative z-10 bg-gradient-to-b from-transparent via-black/40 to-black">
        <HeroParallax products={PARALLAX_PRODUCTS} header={PARALLAX_HEADER} />
      </section>

      {/* ─── CTA ─── */}
      <section className="relative z-10 mx-auto max-w-3xl px-6 pb-24 pt-12 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
          Yeterince izledin mi?{" "}
          <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
            Canlı dene
          </span>
        </h2>
        <p className="mt-4 text-sm text-white/60 sm:text-base">
          Demo hesap hazır — kayıt yok, kredi kartı yok.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              Demo panele git
            </Button>
          </Link>
          <Link href="/">
            <Button
              size="lg"
              variant="outline"
              className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Ana sayfa
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
