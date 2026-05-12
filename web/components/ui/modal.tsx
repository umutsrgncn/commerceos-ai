"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Header gradient tonu — başlık'taki ikon arka planını da renklendirir */
  tone?: "indigo" | "fuchsia" | "emerald" | "amber" | "red" | "muted";
};

const TONE: Record<
  NonNullable<Props["tone"]>,
  { headerBg: string; iconBg: string; iconFg: string; borderTop: string }
> = {
  indigo: {
    headerBg: "from-indigo-500/[0.08] via-indigo-500/[0.03] to-transparent",
    iconBg: "bg-indigo-500/15",
    iconFg: "text-indigo-600 dark:text-indigo-400",
    borderTop: "border-t-indigo-500/40",
  },
  fuchsia: {
    headerBg: "from-fuchsia-500/[0.08] via-fuchsia-500/[0.03] to-transparent",
    iconBg: "bg-fuchsia-500/15",
    iconFg: "text-fuchsia-600 dark:text-fuchsia-400",
    borderTop: "border-t-fuchsia-500/40",
  },
  emerald: {
    headerBg: "from-emerald-500/[0.08] via-emerald-500/[0.03] to-transparent",
    iconBg: "bg-emerald-500/15",
    iconFg: "text-emerald-600 dark:text-emerald-400",
    borderTop: "border-t-emerald-500/40",
  },
  amber: {
    headerBg: "from-amber-500/[0.08] via-amber-500/[0.03] to-transparent",
    iconBg: "bg-amber-500/15",
    iconFg: "text-amber-600 dark:text-amber-400",
    borderTop: "border-t-amber-500/40",
  },
  red: {
    headerBg: "from-red-500/[0.08] via-red-500/[0.03] to-transparent",
    iconBg: "bg-red-500/15",
    iconFg: "text-red-500",
    borderTop: "border-t-red-500/40",
  },
  muted: {
    headerBg: "from-[color:var(--color-fg)]/[0.04] to-transparent",
    iconBg: "bg-[color:var(--color-fg)]/[0.06]",
    iconFg: "text-[color:var(--color-muted)]",
    borderTop: "border-t-[color:var(--color-border)]",
  },
};

const SIZE = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  tone = "indigo",
}: Props) {
  // ESC ile kapan + body scroll kilidi
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const t = TONE[tone];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 -z-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative z-10 w-full overflow-hidden rounded-2xl border-2 bg-[color:var(--color-bg)] shadow-2xl shadow-black/30 animate-in fade-in zoom-in-95",
          t.borderTop,
          "border-x-[color:var(--color-border)] border-b-[color:var(--color-border)]",
          SIZE[size],
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            "relative border-b border-[color:var(--color-border)] px-5 py-4 bg-gradient-to-br",
            t.headerBg,
          )}
        >
          <div className="flex items-start gap-3 pr-8">
            {icon && (
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-white/5",
                  t.iconBg,
                  t.iconFg,
                )}
              >
                {icon}
              </span>
            )}
            <div className="min-w-0">
              <h2 id="modal-title" className="text-base font-semibold truncate">
                {title}
              </h2>
              {description && (
                <p className="mt-0.5 text-xs text-[color:var(--color-muted)]">
                  {description}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] text-[color:var(--color-muted)] transition hover:bg-[color:var(--color-fg)]/[0.06] hover:text-[color:var(--color-fg)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-4">
          {children}
        </div>

        {footer && (
          <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
