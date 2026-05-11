import Link from "next/link";
import { Building2, Mail, Package, Phone, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { listSuppliers } from "@/lib/queries/suppliers";
import { formatRelativeTime } from "@/lib/format";

export const metadata = { title: "Tedarikçiler — CommerceOS" };

export default async function SuppliersPage() {
  const suppliers = await listSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white shadow-md">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
              Tedarikçiler
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[color:var(--color-muted)]">
              Stok kritik seviyeye düşünce <strong>Otopilot</strong> uygun
              tedarikçiye sipariş maili atar. Hangi SKU'ları sağladığını
              listeye ekle.
            </p>
          </div>
        </div>
        <Link href="/admin/suppliers/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yeni tedarikçi
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[color:var(--color-fg)]/[0.05] text-[color:var(--color-muted)]">
                <Building2 className="h-5 w-5" />
              </span>
              <h3 className="text-base font-semibold">Henüz tedarikçi yok</h3>
              <p className="max-w-sm text-sm text-[color:var(--color-muted)]">
                İlk tedarikçini ekle. Sağlıyor olduğu SKU'ları girersen
                Otopilot stok düşünce o tedarikçiyi bulur.
              </p>
              <Link href="/admin/suppliers/new" className="mt-2">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5" />
                  Tedarikçi ekle
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-4 py-3 text-left font-medium">Ad</th>
                    <th className="px-4 py-3 text-left font-medium">İletişim</th>
                    <th className="px-4 py-3 text-left font-medium">SKU sağlanan</th>
                    <th className="px-4 py-3 text-left font-medium">Lead time</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-right font-medium">Eklendi</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/suppliers/${s.id}`}
                          className="hover:underline"
                        >
                          {s.name}
                        </Link>
                        {s.contactPerson && (
                          <div className="text-[10px] text-[color:var(--color-muted)]">
                            {s.contactPerson}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {s.email && (
                          <div className="flex items-center gap-1 text-[color:var(--color-muted)]">
                            <Mail className="h-3 w-3" />
                            {s.email}
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center gap-1 text-[color:var(--color-muted)]">
                            <Phone className="h-3 w-3" />
                            {s.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s.productSkus.length > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <Package className="h-3 w-3 text-[color:var(--color-muted)]" />
                            <span className="text-xs tabular-nums">
                              {s.productSkus.length} SKU
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-[color:var(--color-muted)]">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs tabular-nums">
                        {s.leadTimeDays ?? "—"} gün
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={s.isActive ? "success" : "neutral"}>
                          {s.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
