import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, Github, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import {
  HeroBgOrbs,
  SmoothScroll,
} from "@/components/landing/landing-effects";
import { AiDeveloperSection } from "@/components/landing/ai-developer";
import { LandingFeatures } from "@/components/landing/landing-features";
import { Spotlight } from "@/components/aceternity/spotlight";
import { TextGenerateEffect } from "@/components/aceternity/text-generate";
import { MovingBorderButton } from "@/components/aceternity/moving-border";
import {
  AuthIcon,
  FastApiIcon,
  GeminiIcon,
  GsapIcon,
  LucideIcon,
  MotionIcon,
  NextIcon,
  NodeIcon,
  PlaywrightIcon,
  PostgresIcon,
  PrismaIcon,
  PythonIcon,
  ReactIcon,
  RedisIcon,
  TailwindIcon,
  TypeScriptIcon,
  VitestIcon,
} from "@/components/landing/tech-icons";

export const metadata = {
  title: "CommerceOS — AI-destekli e-ticaret yönetim paneli",
  description:
    "Otopilot 7 farklı işi yönetir: yorum cevabı, e-fatura, stok sipariş, havale eşleştirme, fiyat, segmentasyon, anomali. Gemini AI + Türkiye'ye özel (KVKK, GİB, PayTR).",
};

export default function HomePage() {
  return (
    <>
      <style>{`
        body { overflow-x: hidden; scrollbar-width: none; background: #000; }
        body::-webkit-scrollbar { display: none; }
      `}</style>

      <SmoothScroll />

      <main className="relative min-h-screen bg-black text-white selection:bg-fuchsia-500/40">
        {/* ─── Top nav ─── */}
        <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <CommerceOSLogo size={36} />
              <span className="text-base font-semibold tracking-tight">
                CommerceOS
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-white/60 md:flex">
              <a href="#ai-developer" className="hover:text-white transition">AI</a>
              <a href="#modules" className="hover:text-white transition">Modüller</a>
              <a href="#team" className="hover:text-white transition">Ekip</a>
            </nav>
            <div className="flex items-center gap-2">
              <Link
                href="https://github.com/umutsrgncn/commerceos-ai"
                target="_blank"
                rel="noreferrer"
                className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70 transition hover:border-white/20 hover:text-white sm:inline-flex"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </Link>
              <Link href="/login">
                <Button
                  size="sm"
                  className="bg-white text-black hover:bg-white/90"
                >
                  Giriş yap
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden">
          {/* Aceternity Spotlight — premium beam efekti */}
          <Spotlight />
          {/* Animated floating orbs */}
          <HeroBgOrbs />
          {/* Grid + bottom fade */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_60%,#000_100%)]" />
            <GridPattern />
          </div>

          <div className="mx-auto max-w-5xl px-6 pt-20 pb-24 text-center sm:pt-28">
            <Link
              href="https://github.com/umutsrgncn/commerceos-ai"
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs backdrop-blur-xl transition hover:border-fuchsia-500/40 hover:bg-fuchsia-500/[0.08]"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-fuchsia-400/70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
              </span>
              Hackathon projesi · fatal exception team
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
            </Link>

            <h1 className="mt-7 text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-7xl">
              E-ticaretin{" "}
              <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                AI yönettiği
              </span>
              <br />
              admin paneli
            </h1>

            <TextGenerateEffect
              words="Otopilot 7 farklı işi paralel yönetir — yorum cevabı, e-fatura, stok, havale, fiyat, segment, anomali. Sen sadece onaylarsın."
              className="mx-auto mt-6 max-w-2xl text-pretty text-base font-normal !text-white/70 sm:text-lg"
              duration={0.4}
            />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login">
                <MovingBorderButton
                  duration={3500}
                  borderRadius="9999px"
                  containerClassName="h-12 w-[200px]"
                  className="bg-slate-950/80 hover:bg-slate-900/80"
                >
                  Demo panele git
                  <ArrowRight className="h-4 w-4" />
                </MovingBorderButton>
              </Link>
              <Link href="/watch" target="_blank" rel="noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-white/[0.05] text-white backdrop-blur hover:bg-white/[0.12] hover:text-white"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  1 dakikada tanıtım
                </Button>
              </Link>
              <a href="#ai-developer">
                <Button
                  size="lg"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  AI'ı canlı gör
                </Button>
              </a>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-white/40">
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Kayıt yok
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Kredi kartı yok
              </span>
              <span className="inline-flex items-center gap-1">
                <Check className="h-3 w-3 text-emerald-400" />
                Demo data hazır
              </span>
            </div>

            {/* Dashboard preview */}
            <div className="relative mx-auto mt-16 max-w-5xl">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/20 to-emerald-500/20 opacity-60 blur-2xl" />
              <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-black shadow-2xl">
                <div className="flex items-center gap-1.5 border-b border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  <span className="ml-3 text-[10px] font-mono text-white/40">
                    commerceos.cloud/admin
                  </span>
                </div>
                <div className="relative aspect-[16/10]">
                  <Image
                    src="/team/shot-dashboard-dark.jpg"
                    alt="CommerceOS Dashboard"
                    fill
                    sizes="(min-width: 1024px) 1024px, 100vw"
                    priority
                    className="object-cover object-top"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Tech yığını — kategori bantları ─── */}
        <section className="relative border-y border-white/[0.06] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_60%)] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.36em] text-white/40">
                <span className="h-px w-10 bg-gradient-to-r from-transparent to-white/25" />
                Stack
                <span className="h-px w-10 bg-gradient-to-l from-transparent to-white/25" />
              </div>
              <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
                Üzerine{" "}
                <span className="bg-gradient-to-br from-indigo-300 via-fuchsia-300 to-emerald-300 bg-clip-text text-transparent">
                  inşa edildi.
                </span>
              </h2>
              <div className="mx-auto mt-8 inline-flex items-center gap-3 rounded-full border border-white/[0.08] bg-white/[0.025] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-white/45 backdrop-blur">
                <span className="tabular-nums text-base font-semibold text-white">
                  18
                </span>
                <span>teknoloji</span>
                <span className="h-3.5 w-px bg-white/15" />
                <span className="inline-flex items-center gap-1.5 text-emerald-300/90">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </span>
                  production'da çalışıyor
                </span>
              </div>
            </div>

            <div className="mt-14 grid gap-3 lg:grid-cols-2">
              <TechCategory label="Framework & Runtime" accent="emerald">
                <TechItem icon={<NextIcon />} name="Next.js" tag="15" iconClass="text-white" />
                <TechItem icon={<ReactIcon />} name="React" tag="19" iconClass="text-sky-400" />
                <TechItem icon={<TypeScriptIcon />} name="TypeScript" tag="5.7" iconClass="text-blue-400" />
                <TechItem icon={<NodeIcon />} name="Node" tag="22 LTS" iconClass="text-green-400" />
                <TechItem icon={<AuthIcon />} name="Auth.js" tag="v5" iconClass="text-violet-300" />
              </TechCategory>

              <TechCategory label="Veri & Cache" accent="sky">
                <TechItem icon={<PostgresIcon />} name="PostgreSQL" tag="16" iconClass="text-sky-300" />
                <TechItem icon={<PrismaIcon />} name="Prisma" tag="6" iconClass="text-indigo-300" />
                <TechItem icon={<RedisIcon />} name="Redis" tag="7" iconClass="text-rose-400" />
              </TechCategory>

              <TechCategory label="Yapay zeka" accent="fuchsia">
                <TechItem
                  icon={<GeminiIcon />}
                  name="Gemini"
                  tag="2.0 Flash"
                  iconClass="text-transparent [&_path]:fill-[url(#tech-gem-grad)]"
                  defs={
                    <linearGradient id="tech-gem-grad" x1="0" y1="0" x2="24" y2="24">
                      <stop offset="0%" stopColor="#d946ef" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  }
                />
              </TechCategory>

              <TechCategory label="AI servisi" accent="teal">
                <TechItem icon={<FastApiIcon />} name="FastAPI" tag="0.115" iconClass="text-teal-300" />
                <TechItem icon={<PythonIcon />} name="Python" tag="3.12" />
              </TechCategory>

              <TechCategory label="UI & Motion" accent="cyan">
                <TechItem icon={<TailwindIcon />} name="Tailwind" tag="v4" iconClass="text-cyan-300" />
                <TechItem icon={<MotionIcon />} name="Motion" tag="11" iconClass="text-white" />
                <TechItem icon={<GsapIcon />} name="GSAP" tag="3" iconClass="text-lime-300" />
                <TechItem icon={<LucideIcon />} name="Lucide" tag="icons" iconClass="text-stone-300" />
              </TechCategory>

            </div>

            {/* Test & DX şeridi */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/40">
                Test & DX
              </span>
              <span className="h-3 w-px bg-white/10" />
              <TechChip icon={<VitestIcon />} name="Vitest" iconClass="text-yellow-300" />
              <TechChip icon={<PlaywrightIcon />} name="Playwright" iconClass="text-emerald-300" />
              <TechChip icon={<PythonIcon />} name="pytest" iconClass="text-blue-300" />
            </div>
          </div>
        </section>

        {/* ─── AI Geliştirici — FLAGSHIP (otopilot'tan önce) ─── */}
        <AiDeveloperSection />

        <LandingFeatures />

        {/* ─── Footer ─── */}
        <footer className="border-t border-white/[0.06] bg-black">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
            <div className="flex items-center gap-2">
              <CommerceOSLogo size={28} />
              <span className="text-sm font-semibold">CommerceOS</span>
              <span className="text-xs text-white/40">
                © {new Date().getFullYear()} fatal exception team
              </span>
            </div>

            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
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
    </>
  );
}

// ─── Subcomponents ───────────────────────────────────────────────────────────

function GridPattern() {
  return (
    <svg
      className="absolute inset-0 h-full w-full opacity-[0.15]"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        </pattern>
        <radialGradient id="fade" cx="50%" cy="0%" r="60%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
        <mask id="grid-mask">
          <rect width="100%" height="100%" fill="url(#fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#grid-mask)" />
    </svg>
  );
}

function Pill({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/70">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

const TECH_ACCENT: Record<string, string> = {
  emerald: "before:bg-emerald-400",
  sky: "before:bg-sky-400",
  fuchsia: "before:bg-fuchsia-400",
  teal: "before:bg-teal-400",
  cyan: "before:bg-cyan-400",
  amber: "before:bg-amber-400",
};

function TechCategory({
  label,
  accent,
  children,
}: {
  label: string;
  accent: keyof typeof TECH_ACCENT;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 transition hover:border-white/[0.14] hover:bg-white/[0.03]">
      <div className="flex items-center gap-2">
        <span
          className={`relative inline-block h-1.5 w-1.5 rounded-full before:absolute before:inset-0 before:rounded-full before:opacity-100 ${TECH_ACCENT[accent]}`}
        />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/45">
          {label}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function TechItem({
  icon,
  name,
  tag,
  iconClass,
  defs,
}: {
  icon: React.ReactNode;
  name: string;
  tag?: string;
  iconClass?: string;
  defs?: React.ReactNode;
}) {
  return (
    <div className="group inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-2 transition hover:border-white/20 hover:bg-white/[0.05]">
      {defs && (
        <svg className="absolute h-0 w-0" aria-hidden>
          <defs>{defs}</defs>
        </svg>
      )}
      <span className={`shrink-0 ${iconClass ?? "text-white/85"}`}>{icon}</span>
      <span className="text-sm font-medium leading-none text-white/90">
        {name}
      </span>
      {tag && (
        <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white/55">
          {tag}
        </span>
      )}
    </div>
  );
}

function TechChip({
  icon,
  name,
  iconClass,
}: {
  icon: React.ReactNode;
  name: string;
  iconClass?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-white/80">
      <span className={`${iconClass ?? "text-white/85"} [&_svg]:h-3.5 [&_svg]:w-3.5`}>
        {icon}
      </span>
      {name}
    </span>
  );
}
