"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] shadow-sm hover:opacity-90 active:scale-[0.98]",
        secondary:
          "bg-[color:var(--color-fg)]/5 text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/10 active:scale-[0.98]",
        outline:
          "border border-[color:var(--color-border)] bg-transparent text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5",
        ghost:
          "bg-transparent text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5",
        destructive:
          "bg-red-500 text-white shadow-sm hover:bg-red-500/90 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof button> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(button({ variant, size }), className)}
      {...props}
    />
  )
);

Button.displayName = "Button";
