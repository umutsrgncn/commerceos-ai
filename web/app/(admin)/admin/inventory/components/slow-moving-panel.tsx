import Link from "next/link";
import { AlertTriangle, Hourglass, Package, Sparkles } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProductThumb } from "@/components/products/product-thumb";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { SlowMovingItem } from "@/lib/queries/inventory";
import { CampaignDialog } from "./campaign-dialog";

export function SlowMovingPanel({ items }: { items: SlowMovingItem[] }) {
  // Bağlı sermaye toplamı
  const totalTied = items.reduce(
    (sum, i) => sum + (i.tiedCapitalMinor ?? 0),
    0,
  );
  const missingCost = items.filter((i) => i.costPrice == null).length;

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/[0.04] to-fuchsia-500/[0.03]">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hourglass className="h-4 w-4 text-amber-500" />
              Yavaş hareket eden stok
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {items.length} ürün
              </span>
            </CardTitle>
            <CardDescription>
              Son 30 gün satışı 0 veya 1 adet — bağlı sermaye{" "}
              <strong className="font-mono tabular-nums">
                {formatMoney(totalTied, "TRY")}
              </strong>
              . AI ile her ürün için özel kampanya öner, otopilot kapalı olsa
              da çalışır.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="themed-scroll overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                <th className="px-4 py-2 text-left font-medium">Ürün</th>
                <th className="px-4 py-2 text-right font-medium">Stok</th>
                <th className="px-4 py-2 text-right font-medium">
                  Son 30g satış
                </th>
                <th className="px-4 py-2 text-right font-medium">
                  Hareketsiz
                </th>
                <th className="px-4 py-2 text-right font-medium">Maliyet</th>
                <th className="px-4 py-2 text-right font-medium">
                  Bağlı sermaye
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const hasCost = item.costPrice != null;
                return (
                  <tr
                    key={item.id}
                    className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/admin/products/${item.id}`}
                        className="flex items-center gap-2 hover:underline"
                      >
                        <ProductThumb images={item.image} alt={item.name} className="h-8 w-8" />
                        <div className="min-w-0">
                          <div className="truncate font-medium">{item.name}</div>
                          <div className="font-mono text-[10px] text-[color:var(--color-muted)]">
                            {item.sku}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {item.quantity}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right font-mono tabular-nums",
                        item.soldInWindow === 0
                          ? "text-red-500"
                          : "text-amber-600",
                      )}
                    >
                      {item.soldInWindow}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-[color:var(--color-muted)]">
                      {item.daysSinceLastSale != null
                        ? `${item.daysSinceLastSale} gün`
                        : "60+ gün"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-xs">
                      {hasCost ? (
                        formatMoney(item.costPrice ?? 0, "TRY")
                      ) : (
                        <Link
                          href={`/admin/products/${item.id}`}
                          className="text-amber-600 hover:underline"
                          title="Maliyet eksik — AI öneri için doldur"
                        >
                          + maliyet gir
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">
                      {item.tiedCapitalMinor != null
                        ? formatMoney(item.tiedCapitalMinor, "TRY")
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <CampaignDialog
                        productId={item.id}
                        productName={item.name}
                        hasCostPrice={hasCost}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {missingCost > 0 && (
          <div className="border-t border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <div className="text-[color:var(--color-muted)]">
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  {missingCost} üründe maliyet eksik —
                </span>{" "}
                AI kâr-odaklı kampanya önermesi için ürün detayında{" "}
                <strong>Maliyet</strong> alanı doldurulmalı.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
