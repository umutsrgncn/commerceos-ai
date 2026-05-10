"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, Star } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

const RATING_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "5", label: "5" },
  { value: "4", label: "4" },
  { value: "3", label: "3" },
  { value: "2", label: "2" },
  { value: "1", label: "1" },
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Tümü" },
  { value: "1", label: "Yayında" },
  { value: "0", label: "Taslak" },
] as const;

export function ReviewsFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const currentQ = params.get("q") ?? "";
  const currentRating = params.get("rating") ?? "";
  const currentPublished = params.get("published") ?? "";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, val] of Object.entries(patch)) {
      if (val === null || val === "") next.delete(key);
      else next.set(key, val);
    }
    next.delete("page");
    startTransition(() => router.replace(`/admin/reviews?${next.toString()}`));
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative max-w-sm flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
        <Input
          defaultValue={currentQ}
          placeholder="Yazar, ürün veya yorum içeriği ara"
          className="pl-9"
          onChange={(e) => {
            const v = e.target.value.trim();
            update({ q: v || null });
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          Puan
        </span>
        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
          {RATING_OPTIONS.map((opt) => {
            const active = currentRating === opt.value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => update({ rating: opt.value || null })}
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-md px-2 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                    : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
                )}
              >
                {opt.label}
                {opt.value && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
          Durum
        </span>
        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
          {STATUS_OPTIONS.map((opt) => {
            const active = currentPublished === opt.value;
            return (
              <button
                key={opt.value || "all"}
                type="button"
                onClick={() => update({ published: opt.value || null })}
                className={cn(
                  "rounded-md px-2 py-1.5 text-xs font-medium transition",
                  active
                    ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                    : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
