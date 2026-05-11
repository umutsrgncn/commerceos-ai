import { cn } from "@/lib/cn";

function fmt(minor: number, currency = "TRY"): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function Price({
  amount,
  compareAt,
  currency = "TRY",
  size = "md",
  className,
}: {
  amount: number; // kuruş
  compareAt?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const hasDiscount = compareAt != null && compareAt > amount;
  const sizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  }[size];

  return (
    <span className={cn("inline-flex items-baseline gap-2 tabular-nums", className)}>
      <span className={cn("font-medium", sizeClass)}>{fmt(amount, currency)}</span>
      {hasDiscount && (
        <>
          <span className="text-xs text-[color:var(--color-muted)] line-through">
            {fmt(compareAt!, currency)}
          </span>
          <span className="rounded-full bg-[color:var(--color-accent)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-accent)]">
            %{Math.round(((compareAt! - amount) / compareAt!) * 100)}
          </span>
        </>
      )}
    </span>
  );
}
