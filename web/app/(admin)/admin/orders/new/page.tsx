import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { listAvailableProductsForOrder } from "@/lib/queries/orders";
import { NewOrderForm } from "../components/new-order-form";

export const metadata = { title: "Yeni sipariş — CommerceOS" };

export default async function NewOrderPage() {
  const [customers, products] = await Promise.all([
    db.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
      take: 200,
    }),
    listAvailableProductsForOrder(),
  ]);

  if (customers.length === 0 || products.length === 0) {
    return (
      <div className="space-y-4">
        <Link
          href="/admin/orders"
          className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
        >
          <ArrowLeft className="inline h-4 w-4" /> Siparişler
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <div className="rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-fg)]/[0.025] p-6 text-sm text-[color:var(--color-muted)]">
          {customers.length === 0 && (
            <p>
              Önce bir{" "}
              <Link href="/admin/customers/new" className="underline">
                müşteri ekle
              </Link>
              .
            </p>
          )}
          {products.length === 0 && (
            <p>
              Yayında en az bir ürün lazım.{" "}
              <Link href="/admin/products/new" className="underline">
                Ürün ekle
              </Link>{" "}
              ve durumu <strong>Yayında</strong> yap.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/orders"
        className="text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)]"
      >
        <ArrowLeft className="inline h-4 w-4" /> Siparişler
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Yeni sipariş</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">
          Müşteri seç, ürünleri ekle. Toplam canlı hesaplanır.
        </p>
      </div>
      <NewOrderForm customers={customers} products={products} />
    </div>
  );
}
