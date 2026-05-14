import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  ChevronDown,
  Github,
  Play,
  Sparkles,
} from "lucide-react";

import { HeroParallax } from "@/components/aceternity/hero-parallax";
import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import { HeroBgOrbs } from "@/components/landing/landing-effects";
import {
  FlagshipBadge,
  PipelineGrid,
} from "@/components/landing/ai-developer";
import { WatchPlayer } from "./components/watch-player";

export const metadata = {
  title: "CommerceOS — Tanıtım",
  description: "AI yöneticili e-ticaret panelinin kısa tanıtım videosu ve sayfa bakışı.",
};

const PARALLAX_PRODUCTS = [
  { title: "Dashboard", link: "/admin", thumbnail: "/team/shot-dashboard.jpg" },
  { title: "AI Geliştirici", link: "/admin/agent", thumbnail: "/team/shot-agent.jpg" },
  { title: "AI Geliştirici · dark", link: "/admin/agent", thumbnail: "/team/shot-agent-dark.jpg" },
  { title: "Siparişler", link: "/admin/orders", thumbnail: "/team/shot-orders.jpg" },
  { title: "Otopilot · dark", link: "/admin/autopilot", thumbnail: "/team/shot-autopilot-dark.jpg" },
  { title: "Finans", link: "/admin/finance", thumbnail: "/team/shot-finance.jpg" },
  { title: "Finans · dark", link: "/admin/finance", thumbnail: "/team/shot-finance-dark.jpg" },
  { title: "Gelecek ödemeler", link: "/admin/finance/scheduled", thumbnail: "/team/shot-scheduled.jpg" },
  { title: "Banka · dark", link: "/admin/bank", thumbnail: "/team/shot-bank-dark.jpg" },
  { title: "Ürünler", link: "/admin/products", thumbnail: "/team/shot-products.jpg" },
  { title: "Müşteriler", link: "/admin/customers", thumbnail: "/team/shot-customers.jpg" },
  { title: "Analitik · dark", link: "/admin/analytics", thumbnail: "/team/shot-analytics-dark.jpg" },
  { title: "KVKK talepleri", link: "/admin/data-requests", thumbnail: "/team/shot-data-requests.jpg" },
  { title: "Yorumlar", link: "/admin/reviews", thumbnail: "/team/shot-reviews.jpg" },
  { title: "Shop ana sayfa", link: "/shop", thumbnail: "/team/shot-shop-home.jpg" },
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
      Production'dan canlı görüntüler — karışık tema, gerçek demo verisiyle dolu.
    </p>
  </div>
);

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

      {/* ─── Hero — video ─── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-16 pt-8 sm:pt-16">
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

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/25 to-emerald-500/20 opacity-70 blur-3xl" />
          <WatchPlayer />
        </div>
      </section>

      {/* ─── Flagship pipeline — videonun hemen altı ─── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-16">
        <div className="text-center">
          <FlagshipBadge />
          <h2 className="mt-7 text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Sen{" "}
            <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              düşün.
            </span>{" "}
            AI{" "}
            <span className="bg-gradient-to-br from-fuchsia-300 via-rose-300 to-amber-300 bg-clip-text text-transparent">
              kodlasın.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-white/65 sm:text-base">
            Doğal dilde görev yaz —{" "}
            <span className="text-white">"şu sayfaya şu butonu ekle"</span>.
            Agent planlar, kodlar, test eder, önizleme açar.
          </p>
        </div>

        <PipelineGrid />


        <div className="mt-8 flex justify-center">
          <Link href="/admin/agent">
            <Button size="lg" className="bg-white text-black hover:bg-white/90">
              Demo panele git
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Scroll-down teaser — efectli ─── */}
      <ScrollTeaser />

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

/**
 * Aşağı kaydırma davetiyesi — efectli. CSS animasyonlu chevron + parlayan
 * gradient halka + "16 sayfa canlı görüntü" mesajı.
 */
function ScrollTeaser() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-12 text-center">
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); opacity: 0.65; }
          50% { transform: translateY(8px); opacity: 1; }
        }
        @keyframes ringPulse {
          0%, 100% { transform: scale(1); opacity: 0.35; }
          50% { transform: scale(1.08); opacity: 0.7; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 30px rgba(217, 70, 239, 0.25), 0 0 60px rgba(99, 102, 241, 0.15); }
          50% { box-shadow: 0 0 50px rgba(217, 70, 239, 0.5), 0 0 100px rgba(99, 102, 241, 0.3); }
        }
        .scroll-bob { animation: bob 1.8s ease-in-out infinite; }
        .scroll-ring { animation: ringPulse 2.4s ease-in-out infinite; }
        .scroll-glow { animation: glow 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .scroll-bob, .scroll-ring, .scroll-glow { animation: none; }
        }
      `}</style>

      <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-200">
        <Sparkles className="h-3 w-3" />
        Aşağı kaydır
      </span>

      <h3 className="mt-5 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
        Panelin her sayfası{" "}
        <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
          aşağıda
        </span>
      </h3>
      <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
        16 sayfa, karışık dark/light tema, gerçek demo verisi —
        scroll ettikçe parallax'la akar.
      </p>

      <div className="relative mx-auto mt-10 h-20 w-20">
        {/* Pulsing rings */}
        <div className="scroll-ring absolute inset-0 rounded-full bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 blur-md" />
        <div
          className="scroll-ring absolute inset-2 rounded-full bg-gradient-to-br from-fuchsia-500/40 to-indigo-500/40 blur-sm"
          style={{ animationDelay: "0.3s" }}
        />
        {/* Core button */}
        <a
          href="#parallax-gallery"
          aria-label="Aşağı kaydır"
          className="scroll-glow group relative grid h-20 w-20 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-fuchsia-500/20 via-indigo-500/15 to-emerald-500/15 backdrop-blur transition hover:border-white/30"
        >
          <ChevronDown className="scroll-bob h-7 w-7 text-white transition group-hover:scale-110" />
        </a>
      </div>

      {/* Sub stats — küçük, dikkat çekmeyen */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
        <span>16 sayfa</span>
        <span className="h-3 w-px bg-white/15" />
        <span>karışık tema</span>
        <span className="h-3 w-px bg-white/15" />
        <span>canlı veri</span>
      </div>

      <div id="parallax-gallery" />
    </section>
  );
}
