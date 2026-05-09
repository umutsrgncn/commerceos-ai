"use client";

import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Native HTML <select> styled to match the Input + Button family.
 * Dark mode tweaks:
 *   - color-scheme: light dark → tells Chromium to render the native dropdown
 *     panel using the OS dark palette
 *   - explicit bg on <option> for browsers that ignore color-scheme
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        style={{ colorScheme: "light dark" }}
        className={cn(
          "flex h-10 w-full appearance-none rounded-lg border border-[color:var(--color-border)]",
          "bg-[color:var(--color-bg)] pl-3 pr-9 text-sm text-[color:var(--color-fg)]",
          "transition-colors hover:border-[color:var(--color-fg)]/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          // Force option panel to the theme bg in browsers that respect it.
          "[&>option]:bg-[color:var(--color-bg)] [&>option]:text-[color:var(--color-fg)]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
    </div>
  )
);

Select.displayName = "Select";
