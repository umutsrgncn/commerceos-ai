import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderById } from "@/lib/queries/orders";
import { listRefundsForOrder, getRefundedTotal } from "@/lib/queries/refunds";
import { transitionOrderAction } from "@/lib/actions/orders";
import { getNextStatuses, statusLabel } from "@/lib/orders/workflow";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { getInvoiceByOrder } from "@/lib/queries/invoices";
import { OrderStatusBadge } from "../components/order-status-badge";
import { DraftMessagePanel } from "../components/draft-message-panel";
import { RefundPanel } from "../components/refund-panel";
import { IssueInvoiceButton } from "../components/issue-invoice-button";
import { ShippingCard } from "../components/shipping-card";
import type { Carrier } from "@/lib/shipping/constants";

export const metadata = { title: "Sipariş — CommerceOS" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const [refunds, refundedSoFar, invoice] = await Promise.all([
    listRefundsForOrder(order.id),
    getRefundedTotal(order.id),
    getInvoiceByOrder(order.id),
  ]);

  const nextStatuses = getNextStatuses(order.status);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Siparişler
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-mono text-xl sm:text-2xl font-semibold tracking-tight">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Açıldı: {formatRelativeTime(order.createdAt)}
            {order.createdBy?.name ? ` — ${order.createdBy.name}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/admin/orders/${order.id}/receipt`}>
            <Button type="button" variant="outline" size="sm">
              <Printer className="h-4 w-4" />
              Yazdır
            </Button>
          </Link>
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">E-fatura</CardTitle>
            </CardHeader>
            <CardContent>
              <IssueInvoiceButton
                orderId={order.id}
                existingInvoice={
                  invoice
                    ? {
                        invoiceNumber: invoice.invoiceNumber,
                        status: invoice.status,
                        mode: invoice.mode,
                        documentType: invoice.documentType,
                      }
                    : null
                }
              />
            </CardContent>
          </Card>

          {/* Kargo */}
          <ShippingCard
            orderId={order.id}
            status={order.status}
            carrier={(order.carrier as Carrier | null) ?? null}
            trackingNumber={order.trackingNumber ?? null}
            shippedAt={order.shippedAt ?? null}
            deliveredAt={order.deliveredAt ?? null}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">İade</CardTitle>
            </CardHeader>
            <CardContent>
              <RefundPanel
                orderId={order.id}
                orderTotal={order.total}
                currency={order.currency}
                refundedSoFar={refundedSoFar}
                refunds={refunds}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                AI ile mesaj öner
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DraftMessagePanel
                orderNumber={order.orderNumber}
                customerName={order.customer.name}
                totalLabel={formatMoney(order.total, order.currency)}
              />
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
