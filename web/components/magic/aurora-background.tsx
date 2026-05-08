"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/cn";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  showRadialGradient?: boolean;
}

/**
 * Animated multi-blob aurora gradient. Drop behind hero / login surfaces.
 */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative isolate flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[color:var(--color-bg)] text-[color:var(--color-fg)]",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden
          className="absolute -top-40 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.35),transparent_60%)] blur-3xl"
          animate={{ x: [0, 60, -40, 0], y: [0, 40, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute top-1/2 right-1/4 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.3),transparent_60%)] blur-3xl"
          animate={{ x: [0, -50, 30, 0], y: [0, -30, 50, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="absolute bottom-0 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.25),transparent_60%)] blur-3xl"
          animate={{ x: [0, 40, -30, 0], y: [0, 30, -40, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {showRadialGradient && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,var(--color-bg)_100%)]"
        />
      )}
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
