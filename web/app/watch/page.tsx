import Link from "next/link";
import { ArrowLeft, Github, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CommerceOSLogo } from "@/components/brand/logo";
import { HeroBgOrbs } from "@/components/landing/landing-effects";
import { AiDeveloperSection } from "@/components/landing/ai-developer";
import { LandingFeatures } from "@/components/landing/landing-features";
import { WatchPlayer } from "./components/watch-player";

export const metadata = {
  title: "CommerceOS — Tanıtım",
  description:
    "AI yöneticili e-ticaret panelinin kısa tanıtım videosu ve flagship özellikleri.",
};

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
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-12 pt-8 sm:pt-16">
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
            altında tüm özellikleri keşfet.
          </p>
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-indigo-500/30 via-fuchsia-500/25 to-emerald-500/20 opacity-70 blur-3xl" />
          <WatchPlayer />
        </div>
      </section>

      {/* ─── Ana sayfa içeriğinin tamamı ─── */}
      <AiDeveloperSection />
      <LandingFeatures />
    </main>
  );
}
