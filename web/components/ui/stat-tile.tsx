import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type StatTone =
  | "emerald"
  | "indigo"
  | "fuchsia"
  | "amber"
  | "red"
  | "sky"
  | "purple"
  | "orange"
  | "muted";

const TONE: Record<
  StatTone,
  {
    border: string;
    grad: string;
    iconBg: string;
    iconFg: string;
    valueFg: string;
  }
> = {
  emerald: {
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    grad: "from-emerald-500/[0.07] via-emerald-500/[0.02] to-transparent",
    iconBg: "bg-emerald-500/15",
    iconFg: "text-emerald-600 dark:text-emerald-400",
    valueFg: "text-emerald-700 dark:text-emerald-300",
  },
  indigo: {
    border: "border-indigo-500/30 hover:border-indigo-500/60",
    grad: "from-indigo-500/[0.07] via-indigo-500/[0.02] to-transparent",
    iconBg: "bg-indigo-500/15",
    iconFg: "text-indigo-600 dark:text-indigo-400",
    valueFg: "text-indigo-700 dark:text-indigo-300",
  },
  fuchsia: {
    border: "border-fuchsia-500/30 hover:border-fuchsia-500/60",
    grad: "from-fuchsia-500/[0.07] via-fuchsia-500/[0.02] to-transparent",
    iconBg: "bg-fuchsia-500/15",
    iconFg: "text-fuchsia-600 dark:text-fuchsia-400",
    valueFg: "text-fuchsia-700 dark:text-fuchsia-300",
  },
  amber: {
    border: "border-amber-500/30 hover:border-amber-500/60",
    grad: "from-amber-500/[0.07] via-amber-500/[0.02] to-transparent",
    iconBg: "bg-amber-500/15",
    iconFg: "text-amber-600 dark:text-amber-400",
    valueFg: "text-amber-700 dark:text-amber-300",
  },
  red: {
    border: "border-red-500/40 hover:border-red-500/70 ring-1 ring-red-500/10",
    grad: "from-red-500/[0.08] via-red-500/[0.03] to-transparent",
    iconBg: "bg-red-500/15",
    iconFg: "text-red-500",
    valueFg: "text-red-600 dark:text-red-400",
  },
  sky: {
    border: "border-sky-500/30 hover:border-sky-500/60",
    grad: "from-sky-500/[0.07] via-sky-500/[0.02] to-transparent",
    iconBg: "bg-sky-500/15",
    iconFg: "text-sky-600 dark:text-sky-400",
    valueFg: "text-sky-700 dark:text-sky-300",
  },
  purple: {
    border: "border-purple-500/30 hover:border-purple-500/60",
    grad: "from-purple-500/[0.07] via-purple-500/[0.02] to-transparent",
    iconBg: "bg-purple-500/15",
    iconFg: "text-purple-600 dark:text-purple-400",
    valueFg: "text-purple-700 dark:text-purple-300",
  },
  orange: {
    border: "border-orange-500/30 hover:border-orange-500/60",
    grad: "from-orange-500/[0.07] via-orange-500/[0.02] to-transparent",
    iconBg: "bg-orange-500/15",
    iconFg: "text-orange-600 dark:text-orange-400",
    valueFg: "text-orange-700 dark:text-orange-300",
  },
  muted: {
    border:
      "border-[color:var(--color-border)] hover:border-[color:var(--color-fg)]/30",
    grad: "from-[color:var(--color-fg)]/[0.025] to-transparent",
    iconBg: "bg-[color:var(--color-fg)]/[0.06]",
    iconFg: "text-[color:var(--color-muted)]",
    valueFg: "text-[color:var(--color-fg)]",
  },
};

type Props = {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: StatTone;
  highlight?: boolean;
  className?: string;
};

/**
 * Standart tonal KPI tile — tüm admin sayfalarında ortak hiyerarşi.
 *
 * Tone seçimi rehberi:
 *  • emerald: olumlu/gelir/başarı
 *  • indigo: nötr/operasyonel sayım
 *  • fuchsia: müşteri/segment/yenilik
 *  • amber: uyarı/dikkat — orta seviye risk
 *  • red: kritik/risk/iade
 *  • sky: bilgi/yardımcı/sayısal
 *  • purple: VIP/premium/AI çıktı
 *  • orange: lojistik/kargo
 *  • muted: önemsiz/footer-stat
 */
export function StatTile({
  icon,
  label,
  value,
  hint,
  tone = "muted",
  highlight,
  className,
}: Props) {
  const t = TONE[tone];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-[color:var(--color-bg)] p-4 transition-all hover:-translate-y-0.5 hover:shadow-md",
        t.border,
        highlight && "shadow-md ring-1 ring-inset",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          t.grad,
        )}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
            {label}
          </span>
          {icon && (
            <span
              className={cn(
                "grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ring-inset ring-white/5 transition-transform group-hover:scale-110",
                t.iconBg,
                t.iconFg,
              )}
            >
              {icon}
            </span>
          )}
        </div>
        <div
          className={cn(
            "mt-3 text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight",
            t.valueFg,
          )}
        >
          {value}
        </div>
        {hint && (
          <div className="mt-1 text-xs text-[color:var(--color-muted)]">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
