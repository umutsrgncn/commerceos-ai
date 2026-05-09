import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  formatAddress,
  getCompanyInfo,
  getReceiptData,
} from "@/lib/queries/receipt";
import { formatMoney, formatDate } from "@/lib/format";
import { PrintButton } from "./print-button";
import "./print.css";

export const metadata = { title: "Sipariş Çıktısı — CommerceOS" };

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getReceiptData(id);
  if (!order) notFound();

  const company = await getCompanyInfo();
  const address = formatAddress(order.customer.address);

  return (
    <div className="-m-6 min-h-screen bg-white p-6 text-black dark:bg-white">
      <div data-receipt-hide className="mb-6 flex items-center justify-between">
        <Link
          href={`/admin/orders/${order.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          <ArrowLeft className="inline h-4 w-4" /> Siparişe dön
        </Link>
        <PrintButton />
      </div>

      <div className="receipt-page mx-auto max-w-3xl rounded-2xl border border-neutral-200 bg-white p-10 shadow-sm">
        {/* Başlık */}
        <header className="flex items-start justify-between border-b border-neutral-200 pb-6">
          <div>
            <div className="text-2xl font-bold tracking-tight">{company.name}</div>
            {company.taxId && (
              <div className="mt-1 text-xs text-neutral-500">
                Vergi no: {company.taxId}
              </div>
            )}
            {company.address && (
              <div className="mt-1 text-xs text-neutral-500">{company.address}</div>
            )}
            {(company.phone || company.email) && (
              <div className="mt-1 text-xs text-neutral-500">
                {[company.phone, company.email].filter(Boolean).join(" · ")}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              Sipariş
            </div>
            <div className="font-mono text-lg font-semibold">{order.orderNumber}</div>
            <div className="mt-1 text-xs text-neutral-500">
              {formatDate(order.createdAt)}
            </div>
          </div>
        </header>

        {/* Müşteri */}
        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              Alıcı
            </div>
            <div className="mt-1 font-medium">{order.customer.name}</div>
            <div className="text-sm text-neutral-600">{order.customer.email}</div>
            {order.customer.phone && (
              <div className="text-sm text-neutral-600">{order.customer.phone}</div>
            )}
          </div>
          {address && (
            <div>
              <div className="text-xs uppercase tracking-wider text-neutral-500">
                Teslimat adresi
              </div>
              {address.lines.map((line, i) => (
                <div key={i} className="text-sm text-neutral-700">
                  {line}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Kalemler */}
        <section className="border-y border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-xs uppercase tracking-wider text-neutral-500">
                <th className="py-3 pr-4 text-left font-medium">Ürün</th>
                <th className="py-3 px-4 text-right font-medium">Adet</th>
                <th className="py-3 px-4 text-right font-medium">Birim</th>
                <th className="py-3 pl-4 text-right font-medium">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{item.name}</div>
                    {item.product?.sku && (
                      <div className="font-mono text-xs text-neutral-500">
                        {item.product.sku}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {item.quantity}
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums">
                    {formatMoney(item.unitPrice, order.currency)}
                  </td>
                  <td className="py-3 pl-4 text-right tabular-nums font-medium">
                    {formatMoney(item.total, order.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Toplam */}
        <section className="ml-auto mt-6 max-w-xs space-y-1 text-sm">
          <Row label="Ara toplam" value={formatMoney(order.subtotal, order.currency)} />
          {order.tax > 0 && (
            <Row label="Vergi" value={formatMoney(order.tax, order.currency)} />
          )}
          {order.shipping > 0 && (
            <Row label="Kargo" value={formatMoney(order.shipping, order.currency)} />
          )}
          <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold">
            <span>Toplam</span>
            <span className="tabular-nums">
              {formatMoney(order.total, order.currency)}
            </span>
          </div>
        </section>

        {order.notes && (
          <section className="mt-8 border-t border-neutral-200 pt-4 text-xs text-neutral-600">
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              Not
            </div>
            <div className="mt-1 whitespace-pre-wrap">{order.notes}</div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-neutral-400">
          Bu belge {company.name} tarafından elektronik olarak oluşturulmuştur.
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-neutral-600">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
