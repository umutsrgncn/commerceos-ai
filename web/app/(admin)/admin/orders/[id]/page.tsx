import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/queries/orders";
import { transitionOrderAction } from "@/lib/actions/orders";
import { getNextStatuses, statusLabel } from "@/lib/orders/workflow";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { OrderStatusBadge } from "../components/order-status-badge";

export const metadata = { title: "Sipariş — CommerceOS" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Siparişler
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Açıldı: {formatRelativeTime(order.createdAt)}
            {order.createdBy?.name ? ` — ${order.createdBy.name}` : ""}
          </p>
        </div>

        {nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <form key={status} action={transitionOrderAction}>
                <input type="hidden" name="id" value={order.id} />
                <input type="hidden" name="to" value={status} />
                <Button
                  type="submit"
                  variant={status === "CANCELLED" || status === "REFUNDED" ? "destructive" : "primary"}
                  size="sm"
                >
                  {statusLabel(status)}
                </Button>
              </form>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Kalemler</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-border)] text-xs uppercase tracking-wider text-[color:var(--color-muted)]">
                  <th className="px-6 py-3 text-left font-medium">Ürün</th>
                  <th className="px-4 py-3 text-right font-medium">Adet</th>
                  <th className="px-4 py-3 text-right font-medium">Birim</th>
                  <th className="px-6 py-3 text-right font-medium">Tutar</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-[color:var(--color-border)] last:border-b-0">
                    <td className="px-6 py-3">
                      {item.product ? (
                        <Link
                          href={`/admin/products/${item.product.id}`}
                          className="font-medium hover:underline"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <span className="font-medium">{item.name}</span>
                      )}
                      {item.product?.sku && (
                        <div className="font-mono text-xs text-[color:var(--color-muted)]">
                          {item.product.sku}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatMoney(item.unitPrice, order.currency)}
                    </td>
                    <td className="px-6 py-3 text-right tabular-nums font-medium">
                      {formatMoney(item.total, order.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 border-t border-[color:var(--color-border)] p-6 text-sm">
              <SummaryRow label="Ara toplam" value={formatMoney(order.subtotal, order.currency)} />
              {order.tax > 0 && (
                <SummaryRow label="Vergi" value={formatMoney(order.tax, order.currency)} />
              )}
              {order.shipping > 0 && (
                <SummaryRow label="Kargo" value={formatMoney(order.shipping, order.currency)} />
              )}
              <SummaryRow
                label="Toplam"
                value={formatMoney(order.total, order.currency)}
                emphasized
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Müşteri</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/admin/customers/${order.customer.id}`}
                className="font-medium hover:underline"
              >
                {order.customer.name}
              </Link>
              <div className="text-sm text-[color:var(--color-muted)]">
                {order.customer.email}
              </div>
              {order.customer.phone && (
                <div className="text-sm text-[color:var(--color-muted)]">
                  {order.customer.phone}
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notlar</CardTitle>
              </CardHeader>
              <CardContent className="whitespace-pre-wrap text-sm text-[color:var(--color-muted)]">
                {order.notes}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasized,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={
        emphasized
          ? "flex items-center justify-between border-t border-[color:var(--color-border)] pt-2 text-base font-semibold"
          : "flex items-center justify-between text-[color:var(--color-muted)]"
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
