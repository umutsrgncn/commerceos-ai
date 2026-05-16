"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Package,
  ShoppingCart,
  Users,
  Loader2,
} from "lucide-react";

/**
 * Topbar arama — live dropdown.
 * 250ms debounce + /api/admin/search → ürün, sipariş, müşteri sonuçları
 * altta küçük popover'da gözükür. Ok/escape kapatır, "/" focus eder.
 */

type SearchResults = {
  products: Array<{
    id: string;
    name: string;
    sku: string;
    price: number;
    currency: string;
    images?: unknown;
    status?: string;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    currency: string;
    createdAt: string;
    customer?: { name: string } | null;
  }>;
  customers: Array<{
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  }>;
};

const EMPTY: SearchResults = { products: [], orders: [], customers: [] };

export function TopbarSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // "/" tuşuyla focus
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
        return;
      }
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Dış tıklamada kapat
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!formRef.current) return;
      if (!formRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    const q = value.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          setResults(EMPTY);
        } else {
          const data: SearchResults = await res.json();
          setResults(data);
        }
      } catch {
        // abort veya network — yut
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  function go(href: string) {
    setOpen(false);
    setValue("");
    router.push(href as never);
  }

  function submitToProducts(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    go(`/admin/products?q=${encodeURIComponent(q)}`);
  }

  const hasAny =
    results.products.length + results.orders.length + results.customers.length > 0;
  const showDropdown = open && value.trim().length >= 2;

  return (
    <form
      ref={formRef}
      onSubmit={submitToProducts}
      className="relative hidden md:block flex-1 max-w-md mx-auto"
      role="search"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
      <input
        ref={inputRef}
        type="search"
        name="q"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Ürün, sipariş, müşteri ara…"
        autoComplete="off"
        spellCheck={false}
        className="h-9 w-full rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] pl-9 pr-12 text-sm placeholder:text-[color:var(--color-muted)] transition focus-visible:border-[color:var(--color-accent)]/50 focus-visible:bg-[color:var(--color-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)]/20"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 select-none items-center gap-1 rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-1.5 py-0.5 font-mono text-[10px] text-[color:var(--color-muted)] sm:inline-flex">
        /
      </kbd>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-[60vh] overflow-y-auto rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-bg)] shadow-2xl shadow-black/20 ring-1 ring-black/5">
          {loading && !hasAny && (
            <div className="flex items-center gap-2 px-3 py-3 text-xs text-[color:var(--color-muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Aranıyor…
            </div>
          )}

          {!loading && !hasAny && (
            <div className="px-3 py-4 text-center text-xs text-[color:var(--color-muted)]">
              "{value.trim()}" için sonuç yok
            </div>
          )}

          {results.products.length > 0 && (
            <Section title="Ürünler" icon={Package}>
              {results.products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => go(`/admin/products/${p.id}`)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[color:var(--color-fg)]/[0.04]"
                >
                  <ProductThumb images={p.images} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{p.name}</div>
                    <div className="truncate font-mono text-[10px] text-[color:var(--color-muted)]">
                      {p.sku}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[11px] tabular-nums text-[color:var(--color-fg)]/80">
                    {formatMoney(p.price, p.currency)}
                  </div>
                </button>
              ))}
            </Section>
          )}

          {results.orders.length > 0 && (
            <Section title="Siparişler" icon={ShoppingCart}>
              {results.orders.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => go(`/admin/orders/${o.id}`)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[color:var(--color-fg)]/[0.04]"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                    <ShoppingCart className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium font-mono">
                      {o.orderNumber}
                    </div>
                    <div className="truncate text-[10px] text-[color:var(--color-muted)]">
                      {o.customer?.name ?? "—"} · {o.status}
                    </div>
                  </div>
                  <div className="shrink-0 font-mono text-[11px] tabular-nums">
                    {formatMoney(o.total, o.currency)}
                  </div>
                </button>
              ))}
            </Section>
          )}

          {results.customers.length > 0 && (
            <Section title="Müşteriler" icon={Users}>
              {results.customers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(`/admin/customers/${c.id}`)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition hover:bg-[color:var(--color-fg)]/[0.04]"
                >
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300">
                    <span className="text-[10px] font-bold">
                      {c.name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{c.name}</div>
                    <div className="truncate text-[10px] text-[color:var(--color-muted)]">
                      {c.email}
                    </div>
                  </div>
                </button>
              ))}
            </Section>
          )}

          {/* "Tümünü göster" alt çubuğu */}
          {hasAny && (
            <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.02] px-3 py-1.5 text-[10px] text-[color:var(--color-muted)]">
              <kbd className="rounded border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-1 py-0.5 font-mono">↵</kbd>
              {" "}ile ürünlerde tam liste
            </div>
          )}
        </div>
      )}
    </form>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Package;
  children: React.ReactNode;
}) {
  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-muted)]">
        <Icon className="h-2.5 w-2.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function ProductThumb({ images }: { images: unknown }) {
  const first = Array.isArray(images) && typeof images[0] === "string" ? (images[0] as string) : null;
  if (!first) {
    return (
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
        <Package className="h-3.5 w-3.5" />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={first}
      alt=""
      className="h-7 w-7 shrink-0 rounded-md object-cover"
    />
  );
}

function formatMoney(minor: number, currency: string): string {
  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `${(minor / 100).toFixed(0)} ${currency}`;
  }
}
