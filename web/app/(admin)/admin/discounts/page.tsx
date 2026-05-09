import Link from "next/link";
import { Plus, Power, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listDiscounts, deriveStatus } from "@/lib/queries/discounts";
import {
  toggleDiscountAction,
  deleteDiscountAction,
} from "@/lib/actions/discounts";
import { formatMoney, formatDate } from "@/lib/format";

export const metadata = { title: "İndirimler — CommerceOS" };

const STATUS_VARIANTS = {
  active: "success",
  scheduled: "info",
  expired: "neutral",
  disabled: "warning",
} as const;

const STATUS_LABELS = {
  active: "Aktif",
  scheduled: "Zamanlandı",
  expired: "Süresi doldu",
  disabled: "Pasif",
} as const;

export default async function DiscountsPage() {
  const items = await listDiscounts();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">İndirim kodları</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Yüzde ya da sabit tutar; tarih/min. sepet kapsayıcılarıyla
          </p>
        </div>
        <Link href="/admin/discounts/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yeni kod
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[color:var(--color-muted)]">
              Henüz kod yok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Kod</th>
                    <th className="px-4 py-3 text-left font-medium">Değer</th>
                    <th className="px-4 py-3 text-left font-medium">Geçerlilik</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-right font-medium">Kullanım</th>
                    <th className="px-4 py-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((d) => {
                    const status = deriveStatus(d);
                    const valueLabel =
                      d.type === "PERCENTAGE"
                        ? `%${d.value}`
                        : formatMoney(d.value, "TRY");
                    return (
                      <tr
                        key={d.id}
                        className="border-b border-[color:var(--color-border)] last:border-b-0"
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono font-medium">{d.code}</span>
                          {d.description && (
                            <div className="text-xs text-[color:var(--color-muted)]">
                              {d.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {valueLabel}
                          {d.minSubtotal > 0 && (
                            <div className="text-xs text-[color:var(--color-muted)]">
                              min {formatMoney(d.minSubtotal, "TRY")}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[color:var(--color-muted)]">
                          {d.startsAt ? formatDate(d.startsAt) : "—"}
                          {" → "}
                          {d.endsAt ? formatDate(d.endsAt) : "süresiz"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_VARIANTS[status]}>
                            {STATUS_LABELS[status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {d.redemptionCount}
                          {d.maxRedemptions ? ` / ${d.maxRedemptions}` : ""}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <form action={toggleDiscountAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                aria-label={d.isActive ? "Pasifleştir" : "Aktifleştir"}
                              >
                                <Power className="h-4 w-4" />
                              </Button>
                            </form>
                            <form action={deleteDiscountAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <Button
                                type="submit"
                                variant="ghost"
                                size="icon"
                                aria-label="Sil"
                                className="text-[color:var(--color-muted)] hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
