import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomerById } from "@/lib/queries/customers";
import { deleteCustomerAction } from "@/lib/actions/customers";
import { formatMoney, formatRelativeTime } from "@/lib/format";
import { CustomerForm } from "../components/customer-form";
import { SegmentPanel } from "../components/segment-panel";

export const metadata = { title: "Müşteri — CommerceOS" };

type Address = {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
} | null;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/admin/customers"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Müşteriler
        </Link>

        <form action={deleteCustomerAction}>
          <input type="hidden" name="id" value={customer.id} />
          <Button type="submit" variant="destructive" size="sm">
            <Trash2 className="h-4 w-4" />
            Sil
          </Button>
        </form>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{customer.name}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Eklendi: {formatRelativeTime(customer.createdAt)}
        </p>
      </div>

      <CustomerForm
        mode="edit"
        customer={{
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          notes: customer.notes,
          address: customer.address as Address,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>AI ile segmentasyon</CardTitle>
        </CardHeader>
        <CardContent>
          <SegmentPanel customerId={customer.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sipariş geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-[color:var(--color-muted)]">
              Henüz sipariş yok.
            </p>
          ) : (
            <ul className="divide-y divide-[color:var(--color-border)]">
              {customer.orders.map((order) => (
                <li
                  key={order.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-mono text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:underline"
                  >
                    #{order.orderNumber}
                  </Link>
                  <span className="text-xs text-[color:var(--color-muted)]">
                    {formatRelativeTime(order.createdAt)}
                  </span>
                  <span className="tabular-nums">
                    {formatMoney(order.total, order.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
