import Link from "next/link";
import { Eye, Plus } from "lucide-react";
import type { OrderStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listOrders } from "@/lib/queries/orders";
import { ORDER_STATUSES, statusLabel } from "@/lib/orders/workflow";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { OrderStatusBadge } from "./components/order-status-badge";
import { BulkInvoiceBar } from "./components/bulk-invoice-bar";

export const metadata = { title: "Siparişler — CommerceOS" };

const PAGE_SIZE = 20;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = (
    ORDER_STATUSES as readonly string[]
  ).includes(params.status ?? "")
    ? (params.status as OrderStatus)
    : undefined;

  const { items, total } = await listOrders({
    q: params.q,
    status,
    page,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Siparişler</h1>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {total} sipariş — durumlarına göre filtrele
          </p>
        </div>
        <Link href="/admin/orders/new">
          <Button>
            <Plus className="h-4 w-4" />
            Yeni sipariş
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-lg border border-[color:var(--color-border)] p-1">
        <StatusPill href="/admin/orders" active={!status}>
          Tümü
        </StatusPill>
        {ORDER_STATUSES.map((s) => (
          <StatusPill
            key={s}
            href={`/admin/orders?status=${s}`}
            active={status === s}
          >
            {statusLabel(s)}
          </StatusPill>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-[color:var(--color-muted)]">
              Bu filtreyle sipariş yok.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                    <th className="px-3 py-3 w-8" />
                    <th className="px-4 py-3 text-left font-medium">Sipariş</th>
                    <th className="px-4 py-3 text-left font-medium">Müşteri</th>
                    <th className="px-4 py-3 text-left font-medium">Durum</th>
                    <th className="px-4 py-3 text-right font-medium">Kalem</th>
                    <th className="px-4 py-3 text-right font-medium">Tutar</th>
                    <th className="px-4 py-3 text-right font-medium">Açıldı</th>
                    <th className="px-4 py-3 text-right font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-[color:var(--color-border)] last:border-b-0 hover:bg-[color:var(--color-fg)]/[0.025]"
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          name="bulkOrder"
                          value={o.id}
                          className="h-4 w-4 accent-fuchsia-500"
                          aria-label={`${o.orderNumber} seç`}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-mono text-sm font-medium hover:underline"
                        >
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div>{o.customer.name}</div>
                        <div className="text-xs text-[color:var(--color-muted)]">
                          {o.customer.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {o._count.items}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatMoney(o.total, o.currency)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-[color:var(--color-muted)]">
                        {formatRelativeTime(o.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/orders/${o.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-3.5 w-3.5" />
                            İncele
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toplu fatura kesme floating bar */}
      <BulkInvoiceBar />
    </div>
  );
}

function StatusPill({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-xs font-medium transition",
        active
          ? "bg-[color:var(--color-fg)]/[0.08] text-[color:var(--color-fg)]"
          : "text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      )}
    >
      {children}
    </Link>
  );
}
