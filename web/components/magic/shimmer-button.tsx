"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

/**
 * Animated bordered button with continuous shimmer ring. Good for primary CTAs.
 */
export const ShimmerButton = forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      className,
      children,
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "999px",
      background = "linear-gradient(120deg, oklch(0.55 0.22 265), oklch(0.6 0.2 320))",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      style={
        {
          "--shimmer-color": shimmerColor,
          "--shimmer-size": shimmerSize,
          "--shimmer-duration": shimmerDuration,
          "--border-radius": borderRadius,
          background,
        } as React.CSSProperties
      }
      className={cn(
        "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap px-6 py-3 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_8px_24px_-12px_rgba(99,102,241,0.6)] transition-transform [border-radius:var(--border-radius)] active:translate-y-[1px]",
        className
      )}
      {...props}
    >
      <span
        aria-hidden
        className="absolute inset-0 [border-radius:var(--border-radius)]"
        style={{
          background:
            "conic-gradient(from var(--angle), transparent 0deg, var(--shimmer-color) 30deg, transparent 60deg)",
          animation: "shimmer-spin var(--shimmer-duration) linear infinite",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
          padding: "var(--shimmer-size)",
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2 text-sm font-medium">
        {children}
      </span>
      <style jsx>{`
        @property --angle {
          syntax: "<angle>";
          inherits: false;
          initial-value: 0deg;
        }
        @keyframes shimmer-spin {
          to {
            --angle: 360deg;
          }
        }
      `}</style>
    </button>
  )
);

ShimmerButton.displayName = "ShimmerButton";
