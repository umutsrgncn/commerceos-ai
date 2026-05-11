import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CreditCard,
  FileText,
  Github,
  Package,
  Play,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Button } from "@/components/ui/button";
import { SmoothLoopVideo } from "@/components/ui/smooth-loop-video";

export const metadata = {
  title: "CommerceOS — AI-destekli e-ticaret yönetim paneli",
  description:
    "Sipariş, ürün, müşteri, e-fatura, banka, KVKK, ödeme — hepsi tek panelde. Otopilot ile günlük operasyonu AI yönetir.",
};

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Sipariş yönetimi",
    description:
      "Stok rezervasyonu, kargo entegrasyonu, durum geçişleri, toplu fatura kesme",
    iconClass: "bg-indigo-500/10 text-indigo-400",
  },
  {
    icon: Package,
    title: "Ürün & envanter",
    description: "AI ile açıklama yazımı, görsel üretimi, otomatik stok takibi",
    iconClass: "bg-fuchsia-500/10 text-fuchsia-400",
  },
  {
    icon: Users,
    title: "Müşteri segmentasyonu",
    description: "Sadık / VIP / risky — AI sipariş geçmişine bakıp segmentler",
    iconClass: "bg-emerald-500/10 text-emerald-400",
  },
  {
    icon: Receipt,
    title: "GİB e-fatura",
    description: "E-fatura ve e-arşiv kesme, test entegratörü, otopilot otomatik",
    iconClass: "bg-amber-500/10 text-amber-400",
  },
  {
    icon: CreditCard,
    title: "iyzico tahsilat",
    description: "Sandbox + üretim mod, 3DS callback, otomatik link üretimi",
    iconClass: "bg-rose-500/10 text-rose-400",
  },
  {
    icon: TrendingUp,
    title: "Finans & cash flow",
    description: "Kâr/zarar, gider analizi, AI 30g tahmin + anomali tespiti",
    iconClass: "bg-cyan-500/10 text-cyan-400",
  },
  {
    icon: ShieldCheck,
    title: "KVKK uyumu",
    description: "Çerez banner, AI ile aydınlatma metni, veri silme talepleri",
    iconClass: "bg-violet-500/10 text-violet-400",
  },
  {
    icon: Bot,
    title: "Otopilot modu",
    description:
      "Yorum cevabı, e-fatura, stok sipariş, havale eşleştirme — AI yönetir",
    iconClass: "bg-pink-500/10 text-pink-400",
  },
];

const STATS = [
  { value: "20+", label: "Entegre modül" },
  { value: "7", label: "Otopilot kabiliyeti" },
  { value: "100%", label: "KVKK uyumlu" },
  { value: "Gemini", label: "AI motoru" },
];

const OTOPILOT_ITEMS = [
  "Müşteri yorumlarına Türkçe cevap",
  "Sipariş onayında e-fatura kesimi",
  "Kritik stoğa tedarikçi siparişi",
  "Banka havalelerini eşleştirme",
  "Yavaş ürünlere fiyat önerisi",
  "Müşteri segmentasyonu",
  "Negatif yorum sentiment + flag",
];

// Üretildikten sonra burayı dolduracağız — şu an için CDN public asset
const HERO_VIDEO_URL = "/hero.mp4";

export default function HomePage() {
  return (
    <main className="relative bg-black text-white selection:bg-fuchsia-500/40">
      {/* ─── Hero with video background ─── */}
      <section className="relative isolate flex min-h-screen flex-col overflow-hidden">
        {/* Video layer */}
        <div className="absolute inset-0 -z-10">
          <SmoothLoopVideo
            poster="/hero-poster.jpg"
            className="h-full w-full object-cover opacity-50"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </SmoothLoopVideo>
          {/* Dark vignette + bottom fade to black */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.55)_55%,#000_100%)]" />
          {/* Subtle color wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/30 via-transparent to-fuchsia-950/30" />
        </div>

        {/* Top bar */}
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-lg shadow-fuchsia-500/30">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold tracking-tight">
              CommerceOS
            </span>
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
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.1] hover:text-white"
              >
                Giriş yap
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 pt-10 text-center">
          <Link
            href="https://github.com/umutsrgncn/commerceos-ai"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/80 backdrop-blur-xl transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.08]"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            </span>
            Powered by fatal exception team
            <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-7 max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            E-ticaretini{" "}
            <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              AI yönetsin
            </span>
            ,<br className="hidden sm:block" />
            sen büyümeye odaklan
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-base text-white/70 sm:text-lg">
            Sipariş, ürün, müşteri, e-fatura, banka, KVKK — tek panelde. Otopilot
            günlük operasyonu yönetir, sen sadece onaylarsın.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link href="/login">
              <ShimmerButton>
                Demo panele git
                <ArrowRight className="h-4 w-4" />
              </ShimmerButton>
            </Link>
            <Link href="#features">
              <Button
                variant="outline"
                size="lg"
                className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
              >
                <Play className="h-3.5 w-3.5 fill-white" />
                Neler yapabiliyor?
              </Button>
            </Link>
          </div>

          {/* Stats glassmorphism strip */}
          <div className="mt-20 grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 backdrop-blur-xl"
              >
                <div className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-2xl font-semibold tabular-nums text-transparent sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[10px] uppercase tracking-wider text-white/50">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient mask to black */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-black" />
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1 text-xs font-medium text-fuchsia-300">
            <Zap className="h-3 w-3" />
            Modüller
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Aklına gelen{" "}
            <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
              her şey hazır
            </span>
          </h2>
          <p className="mt-3 text-sm text-white/60 sm:text-base">
            Hepsi entegre, hepsi AI'a bağlı, hepsi tek panelde.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-fuchsia-500/30 hover:bg-fuchsia-500/[0.04]"
              >
                {/* Spotlight effect on hover */}
                <div className="pointer-events-none absolute inset-0 opacity-0 transition group-hover:opacity-100">
                  <div className="absolute -top-1/2 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
                </div>

                <span
                  className={`relative mb-4 grid h-10 w-10 place-items-center rounded-xl transition group-hover:scale-110 ${f.iconClass}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="relative text-base font-semibold">{f.title}</h3>
                <p className="relative mt-1.5 text-xs leading-relaxed text-white/55">
                  {f.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Otopilot showcase ─── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-fuchsia-500/20 bg-gradient-to-br from-indigo-950/40 via-black to-fuchsia-950/30 p-8 sm:p-14">
          {/* Glow orbs */}
          <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 h-60 w-60 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-fuchsia-200">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                </span>
                Otopilot Modu
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Operasyonu AI yönetsin,{" "}
                <span className="bg-gradient-to-br from-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
                  sen stratejiye odaklan
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-sm text-white/60 sm:text-base">
                Otopilot bütçe + güven eşiği sınırları içinde 7 farklı işi
                otomatik yapar. Her aksiyon log'lanır, geri alınabilir, ADMIN
                onayı opsiyoneldir.
              </p>
              <Link href="/login" className="mt-6 inline-block">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-fuchsia-500/30 bg-fuchsia-500/10 text-white hover:bg-fuchsia-500/20 hover:text-white"
                >
                  <Bot className="h-4 w-4" />
                  Demoyu canlı dene
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <ul className="grid grid-cols-1 gap-2 sm:gap-2.5">
              {OTOPILOT_ITEMS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 backdrop-blur transition hover:border-fuchsia-500/30 hover:bg-fuchsia-500/[0.04]"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 text-fuchsia-300">
                    <Sparkles className="h-3 w-3" />
                  </span>
                  <span className="text-sm text-white/85">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative mx-auto max-w-4xl px-6 pb-24 text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
          Hazırsan{" "}
          <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
            panele girelim
          </span>
        </h2>
        <p className="mt-4 text-sm text-white/60 sm:text-base">
          Demo hesap hazır — kredi kartı, kurulum, beklemek yok.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <ShimmerButton>
              demo@commerceos.dev ile gir
              <ArrowRight className="h-4 w-4" />
            </ShimmerButton>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-white/[0.06] bg-black">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold">CommerceOS</span>
            <span className="text-xs text-white/40">
              © {new Date().getFullYear()} fatal exception team
            </span>
          </div>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <FileText className="h-3 w-3" />
              Aydınlatma metni
            </Link>
            <Link href="/data-deletion" className="hover:text-white">
              Veri silme
            </Link>
            <Link
              href="https://github.com/umutsrgncn/commerceos-ai"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-white"
            >
              <Github className="h-3 w-3" />
              GitHub
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 rounded-full bg-fuchsia-500/15 px-3 py-1 font-medium text-fuchsia-300 hover:bg-fuchsia-500/25"
            >
              Panele git
              <ArrowRight className="h-3 w-3" />
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
