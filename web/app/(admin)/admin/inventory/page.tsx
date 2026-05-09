import Link from "next/link";
import { Search } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Envanter</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Stok ekle, çıkar, düşük stok durumlarını izle.
        </p>
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
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                  <th className="px-4 py-3 text-left font-medium">Ürün</th>
                  <th className="px-4 py-3 text-right font-medium">Stok</th>
                  <th className="px-4 py-3 text-right font-medium">Eşik</th>
                  <th className="px-4 py-3 text-left font-medium">Durum</th>
                  <th className="px-4 py-3 text-left font-medium">Düzelt</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const inv = p.inventory ?? {
                    quantity: 0,
                    reorderLevel: 0,
                    reserved: 0,
                    updatedAt: new Date(),
                  };
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 align-top"
                    >
                      <td className="px-4 py-4">
                        <Link
                          href={`/admin/products/${p.id}`}
                          className="font-medium hover:underline"
                        >
                          {p.name}
                        </Link>
                        <div className="font-mono text-xs text-[color:var(--color-muted)]">
                          {p.sku}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="text-base font-semibold tabular-nums">
                          {inv.quantity}
                        </div>
                        {inv.reserved > 0 && (
                          <div className="text-xs text-[color:var(--color-muted)]">
                            {inv.reserved} rezerve
                          </div>
                        )}
                        <div className="text-xs text-[color:var(--color-muted)]">
                          {formatRelativeTime(inv.updatedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right tabular-nums text-[color:var(--color-muted)]">
                        ≤ {inv.reorderLevel}
                      </td>
                      <td className="px-4 py-4">
                        <StockBadge
                          quantity={inv.quantity}
                          reorderLevel={inv.reorderLevel}
                        />
                      </td>
                      <td className="px-4 py-4 w-64">
                        <AdjustForm productId={p.id} />
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-sm text-[color:var(--color-muted)]"
                    >
                      Filtreyle eşleşen ürün yok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
