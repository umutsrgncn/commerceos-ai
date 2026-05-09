import Link from "next/link";
import { AlertTriangle, Boxes, Package, Search, XCircle } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { listInventory } from "@/lib/queries/inventory";
import { formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { AdjustForm } from "./components/adjust-form";
import { StockBadge } from "./components/stock-badge";

export const metadata = { title: "Envanter — CommerceOS" };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low?: string }>;
}) {
  const params = await searchParams;
  const onlyLow = params.low === "1";
  const items = await listInventory({ q: params.q, onlyLow });

  // Stat hesaplamaları
  const totalProducts = items.length;
  let totalUnits = 0;
  let lowCount = 0;
  let outCount = 0;
  for (const p of items) {
    const inv = p.inventory ?? { quantity: 0, reorderLevel: 0 };
    totalUnits += inv.quantity;
    if (inv.quantity <= 0) outCount += 1;
    else if (inv.quantity <= inv.reorderLevel) lowCount += 1;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Envanter</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Stok ekle, çıkar, düşük stok durumlarını izle.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          icon={<Package className="h-4 w-4" />}
          label="Ürün"
          value={String(totalProducts)}
          tone="muted"
        />
        <StatTile
          icon={<Boxes className="h-4 w-4" />}
          label="Toplam adet"
          value={totalUnits.toLocaleString("tr-TR")}
          tone="muted"
        />
        <StatTile
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Düşük stok"
          value={String(lowCount)}
          tone={lowCount > 0 ? "warning" : "muted"}
        />
        <StatTile
          icon={<XCircle className="h-4 w-4" />}
          label="Tükenmiş"
          value={String(outCount)}
          tone={outCount > 0 ? "danger" : "muted"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <form action="/admin/inventory" className="max-w-sm flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-muted)]" />
            <Input
              name="q"
              defaultValue={params.q}
              placeholder="Ürün ara (ad, SKU)"
              className="pl-9"
            />
            {onlyLow && <input type="hidden" name="low" value="1" />}
          </div>
        </form>

        <div className="flex gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
          <Link
            href={params.q ? `/admin/inventory?q=${params.q}` : "/admin/inventory"}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              !onlyLow
                ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            )}
          >
            Tümü
          </Link>
          <Link
            href={
              params.q
                ? `/admin/inventory?q=${params.q}&low=1`
                : "/admin/inventory?low=1"
            }
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition",
              onlyLow
                ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
                : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
            )}
          >
            Sadece düşük
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader className="border-b border-[color:var(--color-border)] py-4">
          <CardTitle className="text-base">Ürünler</CardTitle>
          <CardDescription>Satır içi düzelt, sebep + not bırak</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[color:var(--color-muted)]">
              Filtreyle eşleşen ürün yok.
            </div>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {items.map((p) => {
                const inv = p.inventory ?? {
                  quantity: 0,
                  reorderLevel: 0,
                  reserved: 0,
                  updatedAt: new Date(),
                };
                const refMax = Math.max(inv.reorderLevel * 4, 4);
                const barWidth = Math.min(100, Math.max(2, (inv.quantity / refMax) * 100));
                const barTone =
                  inv.quantity <= 0
                    ? "from-red-500 to-red-400"
                    : inv.quantity <= inv.reorderLevel
                      ? "from-amber-500 to-amber-400"
                      : "from-emerald-500 to-emerald-400";
                return (
                  <li key={p.id} className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center">
                    <div className="flex flex-1 items-center gap-3">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-[color:var(--color-fg)]/[0.04] text-lg">
                        📦
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[color:var(--color-muted)]">
                          <span className="font-mono">{p.sku}</span>
                          <span>·</span>
                          <span>Eşik {inv.reorderLevel}</span>
                          <span>·</span>
                          <span>{formatRelativeTime(inv.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-24 shrink-0 text-right">
                        <div className="text-2xl font-semibold tabular-nums leading-none">
                          {inv.quantity}
                        </div>
                        {inv.reserved > 0 && (
                          <div className="mt-1 text-[10px] text-[color:var(--color-muted)]">
                            {inv.reserved} rezerve
                          </div>
                        )}
                        <div className="mt-1">
                          <StockBadge
                            quantity={inv.quantity}
                            reorderLevel={inv.reorderLevel}
                          />
                        </div>
                      </div>

                      <div className="hidden w-32 sm:block">
                        <div className="relative h-2 w-full overflow-hidden rounded-full bg-[color:var(--color-fg)]/[0.05]">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r transition-all",
                              barTone
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>

                      <div className="w-44 shrink-0">
                        <AdjustForm productId={p.id} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "muted" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-red-500/10 text-red-500"
      : tone === "warning"
        ? "bg-amber-500/10 text-amber-500"
        : "bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]";
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className={cn("grid h-9 w-9 place-items-center rounded-lg", toneClass)}>
          {icon}
        </span>
        <div className="min-w-0">
          <div className="truncate text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
            {label}
          </div>
          <div className="text-xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
