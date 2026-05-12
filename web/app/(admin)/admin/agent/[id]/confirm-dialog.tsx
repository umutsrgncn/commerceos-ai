"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

type Variant = "approve" | "danger";

export function ConfirmDialog({
  open,
  variant,
  title,
  description,
  confirmLabel,
  cancelLabel = "Vazgeç",
  pending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  variant: Variant;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={() => !pending && onCancel()}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      {/* Panel */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl">
        {/* Accent strip */}
        <div
          className={`h-1 w-full ${
            isDanger
              ? "bg-gradient-to-r from-rose-500 to-orange-500"
              : "bg-gradient-to-r from-emerald-500 to-teal-500"
          }`}
        />
        <div className="p-6">
          <div className="flex items-start gap-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                isDanger
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300"
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold">{title}</h3>
              <div className="mt-2 text-sm leading-relaxed text-[color:var(--color-muted)]">
                {description}
              </div>
            </div>
            <button
              type="button"
              onClick={() => !pending && onCancel()}
              disabled={pending}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[color:var(--color-muted)] hover:bg-[color:var(--color-fg)]/[0.05] hover:text-[color:var(--color-fg)] disabled:opacity-50"
              aria-label="Kapat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-2 text-sm font-medium text-[color:var(--color-fg)] transition hover:bg-[color:var(--color-fg)]/[0.04] disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className={`inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
