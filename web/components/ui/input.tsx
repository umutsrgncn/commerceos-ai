"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-[color:var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
