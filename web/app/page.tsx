import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AuroraBackground } from "@/components/magic/aurora-background";
import { GridPattern } from "@/components/magic/grid-pattern";
import { ShimmerButton } from "@/components/magic/shimmer-button";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <AuroraBackground>
      <GridPattern className="[mask-image:radial-gradient(ellipse_at_center,white,transparent_70%)]" />

      <section className="relative mx-auto flex max-w-3xl flex-col items-center px-6 py-32 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.04] px-3 py-1 text-xs text-[color:var(--color-muted)] backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          Powered by Gemini
        </span>

        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">
          The admin console for{" "}
          <span className="bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent">
            modern commerce
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-pretty text-base text-[color:var(--color-muted)] sm:text-lg">
          Manage products, customers, and orders with an AI copilot that drafts
          listings, surfaces insights, and answers support questions in your voice.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <ShimmerButton>
              Get started
              <ArrowRight className="h-4 w-4" />
            </ShimmerButton>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg">
              See features
            </Button>
          </Link>
        </div>
      </section>
    </AuroraBackground>
  );
}
