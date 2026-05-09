"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const STATUS_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "DRAFT", label: "Taslak" },
  { value: "PUBLISHED", label: "Yayında" },
  { value: "ARCHIVED", label: "Arşiv" },
] as const;

export function ProductsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentStatus = params.get("status") ?? "";
  const currentQ = params.get("q") ?? "";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, val] of Object.entries(patch)) {
      if (val === null || val === "") next.delete(key);
      else next.set(key, val);
    }
    next.delete("page");
    startTransition(() => router.replace(`/admin/products?${next.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
        <Input
          defaultValue={currentQ}
          placeholder="Ürün ara (ad, SKU, slug)"
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value.trim();
            update({ q: value || null });
          }}
        />
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
        {STATUS_OPTIONS.map((option) => {
          const active = currentStatus === option.value;
          return (
            <button
              key={option.value || "all"}
              type="button"
              onClick={() => update({ status: option.value || null })}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                  : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
