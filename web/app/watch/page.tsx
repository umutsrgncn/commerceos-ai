import Link from "next/link";
import { ArrowLeft, Github, Play, Sparkles } from "lucide-react";

import { HeroParallax } from "@/components/aceternity/hero-parallax";
import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import { HeroBgOrbs } from "@/components/landing/landing-effects";
import { WatchPlayer } from "./components/watch-player";

export const metadata = {
  title: "CommerceOS — 1 dakikada tanıtım",
  description: "AI yöneticili e-ticaret panelinin kısa tanıtım videosu.",
};

const PARALLAX_PRODUCTS = [
  { title: "Dashboard", link: "/admin", thumbnail: "/team/shot-dashboard.jpg" },
  { title: "Siparişler", link: "/admin/orders", thumbnail: "/team/shot-orders.jpg" },
  { title: "Otopilot", link: "/admin/autopilot", thumbnail: "/team/shot-autopilot.jpg" },
  { title: "Finans", link: "/admin/finance", thumbnail: "/team/shot-finance.jpg" },
  { title: "Ürünler", link: "/admin/products", thumbnail: "/team/shot-products.jpg" },
  { title: "Müşteriler", link: "/admin/customers", thumbnail: "/team/shot-customers.jpg" },
  { title: "Analitik", link: "/admin/analytics", thumbnail: "/team/shot-analytics.jpg" },
  { title: "KVKK", link: "/admin/settings/kvkk", thumbnail: "/team/shot-kvkk.jpg" },
  { title: "Dashboard", link: "/admin", thumbnail: "/team/shot-dashboard.jpg" },
  { title: "Otopilot", link: "/admin/autopilot", thumbnail: "/team/shot-autopilot.jpg" },
  { title: "Siparişler", link: "/admin/orders", thumbnail: "/team/shot-orders.jpg" },
  { title: "Finans", link: "/admin/finance", thumbnail: "/team/shot-finance.jpg" },
  { title: "Müşteriler", link: "/admin/customers", thumbnail: "/team/shot-customers.jpg" },
  { title: "Ürünler", link: "/admin/products", thumbnail: "/team/shot-products.jpg" },
  { title: "Analitik", link: "/admin/analytics", thumbnail: "/team/shot-analytics.jpg" },
];

const PARALLAX_HEADER = (
  <div className="relative mx-auto w-full max-w-7xl px-4 pt-16 pb-8 sm:pt-20">
    <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
      <Sparkles className="h-3 w-3" />
      Sayfalara hızlı bakış
    </span>
    <h2 className="mt-3 text-3xl font-bold text-white sm:text-5xl">
      Panelin{" "}
      <span className="bg-gradient-to-br from-fuchsia-300 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
        ihtiyaç duyduğu
      </span>{" "}
      her sayfa
    </h2>
    <p className="mt-3 max-w-2xl text-sm text-white/60 sm:text-base">
      Aşağı kaydırarak panelin tüm modüllerinin gerçek görsellerini gör.
      Üstte 1 dakikada yapıyı anlatan video var.
    </p>
  </div>
);

export default function WatchPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black text-white">
      {/* Soft hero background */}
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
            href="https://github.com/umutsrgncn/commerceos-ai"
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

      {/* Hero — video player */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-8 sm:pt-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
            <Play className="h-3 w-3 fill-fuchsia-300" />
            1 dakikalık tanıtım
          </span>
          <h1 className="mt-5 text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
            CommerceOS,{" "}
            <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              60 saniyede
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/65 sm:text-base">
            AI yöneticili e-ticaret panelinin önemli özelliklerini bir bakışta
            görüyorsun.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/25 to-emerald-500/20 opacity-70 blur-3xl" />
          <WatchPlayer />
        </div>

        {/* Stats below player */}
        <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { v: "60 sn", l: "Tanıtım" },
            { v: "15+", l: "AI noktası" },
            { v: "7", l: "Otopilot kabiliyeti" },
            { v: "20+", l: "Entegre modül" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
            >
              <div className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-2xl font-semibold tabular-nums text-transparent">
                {s.v}
              </div>
              <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Parallax sayfa galeri */}
      <section className="relative z-10 bg-gradient-to-b from-transparent via-black/40 to-black">
        <HeroParallax products={PARALLAX_PRODUCTS} header={PARALLAX_HEADER} />
      </section>

      {/* CTA */}
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
