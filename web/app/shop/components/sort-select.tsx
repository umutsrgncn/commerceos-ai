"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

const OPTIONS = [
  { value: "new", label: "Yeniler önce" },
  { value: "price-asc", label: "Fiyat: artan" },
  { value: "price-desc", label: "Fiyat: azalan" },
  { value: "popular", label: "En çok satanlar" },
];

export function SortSelect({ initial }: { initial: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function change(value: string) {
    const next = new URLSearchParams(params.toString());
    next.set("sort", value);
    next.delete("page"); // sıralama değişince ilk sayfaya dön
    router.push(`${pathname}?${next.toString()}` as never);
  }

  return (
    <div className="relative">
      <label htmlFor="sort" className="sr-only">
        Sırala
      </label>
      <select
        id="sort"
        defaultValue={initial}
        onChange={(e) => change(e.currentTarget.value)}
        className="appearance-none rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 pr-9 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)]/30"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2" />
    </div>
  );
}
